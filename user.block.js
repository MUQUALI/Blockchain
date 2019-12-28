const SHA256 = require('crypto-js/sha256')

function UserBlock(user, previousHash) {
	this.user = user
	this.previousHash = previousHash
	this.hash = this.calculateHash()
	this.nonce = 0
}

UserBlock.prototype.calculateHash = function() {
	return SHA256(this.previousHash + JSON.stringify(this.user) + this.nonce).toString()
}

UserBlock.prototype.mineBlock = function(difficulty) {

	while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
		this.nonce++
		this.hash = this.calculateHash()
	}

}

UserBlock.prototype.hasValid = function() {

	if(!this.user.isValid()) {
		return false
	}

	return true
}

module.exports = UserBlock