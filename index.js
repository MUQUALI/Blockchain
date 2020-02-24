const app = require('express')();
const express = require('express')
const cookieParser = require('cookie-parser')
const http = require('http').createServer(app);
const io = require('socket.io')(http);
require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true});

const auth = require('./auth/login.auth.js')

const Blockchain = require('./blockchain')
const Block = require('./block')
const Transaction = require('./transaction')
const User = require('./models/user.model.js')


var bodyParser = require('body-parser')

const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const key = ec.genKeyPair()

//db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

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
let authCode = ['1201', '2020']


app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', async function(req, res) {

	let errs = []
	if(!req.body.username) {
		errs.push('tài khoản là bắt buộc')
	}
	if(!req.body.password) {
		errs.push('mật khẩu là bắt buộc')
	}

	let userLogin = await User.findOne({username: req.body.username})

	if(!userLogin || userLogin.password !== req.body.password) {
		errs.push('sai tài khoản hoặc mật khẩu')
	}

	if(errs.length) {
		res.render('login', { 
			title: 'Login',
			errs: errs
		});
		return;
	}

	res.cookie('username', userLogin.username, {
			signed: true
	})

	usernameLogin = req.body.username

	res.redirect('/')
	return
});

app.get('/register', function(req, res){
  res.render('register');
});

app.post('/register', async function(req, res){
	let errs = []

	if(!req.body.username) {
		errs.push('tài khoản là bắt buộc')
	}

	if(!req.body.password) {
		errs.push('mật khẩu là bắt buộc')
	}

	let checkExits = await User.find({username: req.body.username})

	if(checkExits.length > 0) {
		errs.push('đã tồn tại tài khoản')
	}

	const privateKey = key.getPrivate('hex')
	const userKey = ec.keyFromPrivate(privateKey)
	this.private_key = privateKey
	this.pub_key = userKey.getPublic('hex')

	let userRegister = {
		username : req.body.username,
		password : req.body.password,
		full_name : req.body.full_name,
		pub_key: userKey.getPublic('hex'),
		private_key: privateKey
	}

	if(req.body.is_charity) {
		userRegister.is_charity = true
		userRegister.charity_credit = req.body.charity_credit
		userRegister.charity_bank = req.body.charity_bank
		userRegister.charity_phone = req.body.charity_phone

		let auth = false;
		for(code of authCode) {
			if(req.body.code == code) {
				auth = true
			}
		}

		if(!auth) {
			errs.push('Sai mã xác thực, vui lòng liên hệ để lấy mã !')
		}
	}

	if(errs.length) {
		res.render('register', { 
			title: 'Register',
			errs: errs
		});
		return;

	}
	User.create(userRegister, function(err, doc) {
		if(err) {
			throw new Error('opp!! something wrong ...')
		}
	})

	res.redirect('/login')
})


app.get('/', auth.authLogin, function(req, res) {
	res.render('index', {
		user: usernameLogin
	})
})

app.get('/home/search', auth.authLogin, function(req, res) {
	let key = req.query.search_box
	let searchChain = blockChain.chain.filter(block => {
		if(block.transactions[0].creditOwner.indexOf(key) || block.transactions[0].creditNumber.indexOf(key)
			|| block.transactions[0].receiveOwner.indexOf(key) || block.transactions[0].charityCredit.indexOf(key)) {
			return block
		}
	})
	res.render('indexsearch', {
		blockChain: searchChain
	})
})

app.get('/user',auth.authLogin, async function(req, res) {
	let user = await User.findOne({username: req.signedCookies.username})

	let money = blockChain.getBalanceOfAdress(user.pub_key)

	let yourChain = blockChain.chain.filter(block => {
		if(block.transactions[0].fromAdress === user.pub_key)
			return block
	})

	res.render('user', {
		user: user,
		money: money,
		blockChain: yourChain
	})
})

app.get('/chain',auth.authLogin, function(req, res) {
	if(req.query.search_box) {
		let searchChain = blockChain.chain.filter(block => {
			if(block.hash == req.query.search_box) {
				return block
			}
		})

		res.render('chain', {
			blockChain: searchChain
		})
		return	
	}
	res.render('chain', {
		blockChain: blockChain.chain.slice(1)
	})
})

app.get('/chain/:id',auth.authLogin, function(req, res) {
	var id = req.params.id
	var block = blockChain.chain.find(function(block) {
		return block.hash === id ? block : ''
	})

	res.render('detail', {
		block: block
	})
})

app.get('/charity',auth.authLogin, async function(req, res) {
	var charitys = await User.find({is_charity: true})

	res.render('charity', {
		charitys: charitys
	})
})

app.post('/charity', async function(req, res) {req.signedCookies.username

	let userSend = await User.findOne({username: req.signedCookies.username})
	let fromAdress = userSend.pub_key
	let toAdress = req.body.charity_pub_key

	let creditNumber = req.body.creditNumber
	let creditOwner = req.body.creditOwner
	let bank = req.body.bank
	
	let amount = parseInt(req.body.amount)

	let userReceive = await User.findOne({pub_key: toAdress})
	let receiveOwner = userReceive.full_name
	let charityCredit = userReceive.charity_credit
	let CharityBank = userReceive.charity_bank

	let transaction = new Transaction(fromAdress, toAdress, amount, creditNumber, creditOwner, bank, 
		receiveOwner, charityCredit, CharityBank)

	transaction.signTransaction(ec.keyFromPrivate(userSend.private_key))

	blockChain.addTransaction(transaction)

	blockChain.minePendingTransactions(fromAdress)

	//userSend.money += blockChain.getBalanceOfAdress(fromAdress)
	//userReceive.money = parseInt(blockChain.getBalanceOfAdress(toAdress))

	//blockChain.createUser(userSend)

	//blockChain.createUser(userReceive)

	res.redirect('/')
})

// hanlde socketio

http.listen(3000, function(){
  console.log('listening');
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
		}
		else {
			throw new Error('something wrong!!!')
		}
	})
	setInterval(function() {
		if(flagSendTransaction == 1) {
			io.sockets.emit('SERVER_SEND_TRANS', blockChain.chain)
			flagSendTransaction = 0;
		}
		
	},3000)
})