const SHA256 = require('crypto-js/sha256')

function Block(timestamp, transactions, previousHash) {
	this.timestamp = timestamp
	this.transactions = transactions
	this.previousHash = previousHash
	this.hash = this.calculateHash()
	this.nonce = 0
}

Block.prototype.calculateHash = function() {
	return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString()
}

Block.prototype.mineBlock = function(difficulty) {

	while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
		this.nonce++
		this.hash = this.calculateHash()
	}

	console.log("Block is mined: ", this.hash)
}

Block.prototype.hasValidTransactions = function() {

	for(const tx of this.transactions) {
		if(!tx.isValid()) {
			return false
		}
	}

	return true
}

module.exports = Block