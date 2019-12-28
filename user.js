const SHA256 = require('crypto-js/sha256')
var prettyjson = require('prettyjson')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

function User(username, password, money, is_charity) {
	this.username = username
	this.password = password
	this.money = money
	this.is_charity = is_charity
	this.createKeyPair()
}


User.prototype.calculateHash = function() {
	return SHA256(this.username + this.password + this.money).toString()
}

User.prototype.createKeyPair= function() {
	const key = ec.genKeyPair()
	const privateKey = key.getPrivate('hex')
	const userKey = ec.keyFromPrivate(privateKey)
	this.private_key = privateKey
	this.pub_key = userKey.getPublic('hex')
}


User.prototype.signRegister= function(signingKey) {

	const hashTx = this.calculateHash()
	const sig = signingKey.sign(hashTx, 'base64')
	this.signature = sig.toDER('hex')
}


User.prototype.isValid = function() {

	if(!this.signature || this.signature.length === 0) {
		throw new Error('No signature in this block')
	}

	const publicKey = ec.keyFromPublic(this.pub_key, 'hex')
	return publicKey.verify(this.calculateHash(), this.signature)
}

module.exports = User

