var app = require('express')();
var cookieParser = require('cookie-parser')
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const Blockchain = require('./blockchain')
const Block = require('./block')
const Transaction = require('./transaction')
const User = require('./user')


var bodyParser = require('body-parser')

const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const key = ec.genKeyPair()

//db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ users: []})
  .write()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser('MY_SECCRET'))

// view-engine
app.set('view engine', 'ejs')
app.set('views', './views')

// defination block chain
let blockChain = new Blockchain();


app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res) {

	let errs = []
	if(!req.body.username) {
		errs.push('tài khoản là bắt buộc')
	}
	if(!req.body.password) {
		errs.push('mật khẩu là bắt buộc')
	}

	let userLogin = blockChain.userChain.find(block => {
		return block.user.username === req.body.username
	})
	if(!userLogin || userLogin.user.password !== req.body.password) {
		errs.push('sai tài khoản hoặc mật khẩu')
	}

	if(errs.length) {
		res.render('login', { 
			title: 'Login',
			errs: errs
		});
		return;
	}

	res.cookie('username', userLogin.user.username, {
			signed: true
	})

	res.render('index', {
		user: userLogin.user
	})
	return
});

app.get('/register', function(req, res){
  res.render('register');
});

app.post('/register', function(req, res){
	let userData = blockChain.userChain
	let errs = []

	if(!blockChain.isValidUserData()) {
		errs.push('dữ liệu hệ thống đã bị thay đổi, vui lòng chờ đội ngũ kỹ thuật khắc phục !!')
	}

	if(!req.body.username) {
		errs.push('tài khoản là bắt buộc')
	}

	if(!req.body.password) {
		errs.push('mật khẩu là bắt buộc')
	}

	let userRegister = new User(req.body.username, req.body.password, 1000, 0)

	if(userData.indexOf(userRegister) >= 0) {
		errs.push('đã tồn tại tài khoản')
	}

	if(errs.length) {
		res.render('register', { 
			title: 'Register',
			errs: errs
		});
		return;

	}

	blockChain.createUser(userRegister)
	console.log(blockChain.userChain)

	res.redirect('/login')
});

app.get('/charity', function(req, res) {
	var charitys = blockChain.userChain.filter(block => {
		if(block.user.is_charity == 1) {
			return block
		}
	})

	charitys = charitys.map(block => block.user)

	res.render('charity', {
		charitys: charitys
	})
})

app.post('/charity', function(req, res) {

	let blockFind = blockChain.userChain.find(block => {
		return block.user.username === req.signedCookies.username
	})
	let blockSend = blockChain.userChain.lastIndexOf(blockFind)

	let userSend = blockChain.userChain[blockSend].user
	let fromAdress = userSend.pub_key
	let toAdress = req.body.charity_pub_key
	let amount = parseInt(req.body.amount)

	let transaction = new Transaction(fromAdress, toAdress, amount)

	transaction.signTransaction(ec.keyFromPrivate(userSend.private_key))

	blockChain.addTransaction(transaction)

	blockChain.minePendingTransactions(fromAdress)

	let blockReceive = blockChain.userChain.find(block => {
		return block.user.pub_key === toAdress
	})

	let userReceive = blockChain.userChain[blockChain.userChain.lastIndexOf(blockReceive)].user

	userSend.money += blockChain.getBalanceOfAdress(fromAdress)
	userReceive.money += parseInt(blockChain.getBalanceOfAdress(toAdress))

	blockChain.createUser(userSend)

	blockChain.createUser(userReceive)

	res.render('index', {
		blockChain: blockChain.chain,
		user: userSend
	})
})


http.listen(3000, function(){
  console.log('listening on *:3000');
});