var app = require('express')();
var express = require('express')
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
app.use(express.static('public'))

// view-engine
app.set('view engine', 'ejs')
app.set('views', './views')

// defination block chain
let blockChain = new Blockchain()
let flagFirstLogin = 0
let listNode = []
let flagSendTransaction = 0
let usernameLogin = ''


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
			signed: false
	})

	usernameLogin = req.body.username

	res.redirect('/home')
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

	let userRegister = new User(req.body.username, req.body.password, 0, 0)

	let checkExits = userData.find(block => {
		return block.user.username === userRegister.username
	})

	if(checkExits) {
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

	//console.log(blockChain.userChain)

	res.redirect('/login')
})


app.get('/home', function(req, res) {
	res.render('index', {
		user: usernameLogin
	})
})

app.get('/user', function(req, res) {
	let username = req.query.username
	let privateChain = blockChain.chain.filter(block => {
		if(block.transaction[0].creditOwner == username) {
			return block
		}
	})
	res.render('user', {
		blockChain: privateChain,
		user: username
	})
})



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
		return block.user.username === req.cookies.username
	})
	let blockSend = blockChain.userChain.lastIndexOf(blockFind)

	let userSend = blockChain.userChain[blockSend].user
	let fromAdress = userSend.pub_key
	let toAdress = req.body.charity_pub_key

	let creditNumber = req.body.creditNumber
	let creditOwner = req.body.creditOwner
	let bank = req.body.bank
	
	let amount = parseInt(req.body.amount)
	//console.log(Transaction)

	let blockReceive = blockChain.userChain.find(block => {
		return block.user.pub_key === toAdress
	})

	let userReceive = blockChain.userChain[blockChain.userChain.lastIndexOf(blockReceive)].user
	let receiveOwner = userReceive.username

	let transaction = new Transaction(fromAdress, toAdress, amount, creditNumber, creditOwner, bank, receiveOwner)

	transaction.signTransaction(ec.keyFromPrivate(userSend.private_key))

	blockChain.addTransaction(transaction)

	blockChain.minePendingTransactions(fromAdress)

	//userSend.money += blockChain.getBalanceOfAdress(fromAdress)
	//userReceive.money = parseInt(blockChain.getBalanceOfAdress(toAdress))

	//blockChain.createUser(userSend)

	//blockChain.createUser(userReceive)

	res.redirect('/home')
})

// hanlde socketio

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket) {
	socket.on('USER_LOGIN', function() {
		socket.emit('SERVER_SEND_BLOCKCHAIN', blockChain)
	})

	socket.on('ALL_CLIENT_SEND', function(data) {
		if(flagFirstLogin == 1) {
			listNode.push(data)
			flagFirstLogin = 0
			//console.log(listNode)
			//console.log(flagFirstLogin)
		}

	})

	// socket.on('USER_REGISTER', function() {
	// 	socket.broadcast.emit('SERVER_SEND_BLOCKCHAIN', blockChain)
	// })

	socket.on('CLIENT_SEND_BLOCKCHAIN', function(data) {
		//listNode.push(data)
		let target = Math.ceil(listNode.length / 2)
		let authen = 0
		data = Object.assign(new Blockchain, data) // ép kiểu về dạng BlockChain
		if(data.isChainValid()) {
			//
			for(let node of listNode) {
				if(listNode.length == 1) {
					break;
				}
				node = Object.assign(new Blockchain, node)
				if(JSON.stringify(data) === JSON.stringify(node)) {
					authen++;
				}

				if(authen >= target) {
					break;
				}
			}
			if(authen < target && listNode.length > 1) {
				throw new Error('something wrong!!!')
			}
			flagSendTransaction = 1;
			//socket.broadcast.emit('SERVER_SEND_TRANS')
		}
		else {
			throw new Error('something wrong!!!')
		}
	})
	setInterval(function() {
		if(flagSendTransaction == 1) {
			console.log(flagSendTransaction)
			io.sockets.emit('SERVER_SEND_TRANS', blockChain.chain)
			flagSendTransaction = 0;
		}
		
	},3000)
})