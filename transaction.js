const SHA256 = require('crypto-js/sha256')
var prettyjson = require('prettyjson')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

function Transaction(fromAdress, toAdress, amount, creditNumber, creditOwner, bank, receiveOwner,
																	charityCredit, CharityBank) {
	this.fromAdress = fromAdress
	this.toAdress = toAdress
	this.amount = amount
	this.creditNumber = creditNumber
	this.creditOwner = creditOwner
	this.bank = bank
	this.receiveOwner = receiveOwner
	this.charityCredit = charityCredit
	this.CharityBank = CharityBank
}

Transaction.prototype.calculateHash = function() {
	return SHA256(this.fromAdress + this.toAdress + this.amount + 
		this.creditNumber + this.creditOwner + this.bank + this.receiveOwner).toString()
}

Transaction.prototype.signTransaction = function(signingKey) {
	if(signingKey.getPublic('hex') !== this.fromAdress) {
		throw new Error('you cannot sign transaction for other wallet')
	}

	const hashTx = this.calculateHash()
	const sig = signingKey.sign(hashTx, 'base64')
	this.signature = sig.toDER('hex')
}

Transaction.prototype.isValid = function() {
	if(!this.fromAdress) {
		return true
	}

	if(!this.signature || this.signature.length === 0) {
		throw new Error('No signature in this transaction')
	}

	const publicKey = ec.keyFromPublic(this.fromAdress, 'hex')
	return publicKey.verify(this.calculateHash(), this.signature)
}

module.exports = Transaction