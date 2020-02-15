// const Block = require('./block')
// const Transaction = require('./transaction')
// const UserBlock = require('./user.block') 
// const User = require('./user')

// const EC = require('elliptic').ec
// const ec = new EC('secp256k1')

function BlockChain() {
	this.chain = []
	this.difficulty = 2
	this.pendingTransactions = []
	this.miningReward = 100
	this.userChain = []
}

// BlockChain.prototype.createGenesisBlock = function() {
// 	return new Block(0, "11/23/2019", "Genesis Block", "0")
// }

// BlockChain.prototype.createGenesisUser = function() {
// 	let charity = new User("charity", "1", 0, 1)
// 	return new UserBlock(charity, 0)
// }


// BlockChain.prototype.getLastBlock = function() {
// 	return this.chain[this.chain.length - 1]
// }

// BlockChain.prototype.getLastUser = function() {
// 	return this.userChain[this.userChain.length - 1]
// }

// BlockChain.prototype.minePendingTransactions = function(miningRewardAdress) {
// 	let date = new Date()
// 	let curentTime = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear() + ''
// 	let block = new Block(curentTime, this.pendingTransactions)
// 	block.previousHash = this.getLastBlock().hash
// 	block.mineBlock(this.difficulty)

// 	this.chain.push(block)

// 	//this.pendingTransactions = [new Transaction(null, miningRewardAdress, this.miningReward)]
// 	this.pendingTransactions = []
// }

// BlockChain.prototype.addTransaction = function(transaction) {
// 	// cai nay de kiem tra khi tao 1 transaction , khac voi trans dc tao ra khi mine block
// 	if(!transaction.fromAdress || !transaction.toAdress) {
// 		throw new Error('Transaction must include from and to address')
// 	}

// 	if(!transaction.isValid()) {
// 		throw new Error('Cannot add invalid transaction')
// 	}
// 	this.pendingTransactions.push(transaction)
// }

// BlockChain.prototype.getBalanceOfAdress = function(address) {
// 	let balance = 0

// 	for(let block of this.chain) {
// 		for(let tran of block.transactions) {
// 			if(tran.fromAdress === address) {
// 				balance -= tran.amount
// 			}

// 			if(tran.toAdress === address) {
// 				balance += tran.amount
// 			}
// 		}
// 	}

// 	return balance
// }

// BlockChain.prototype.isChainValid = function() {
// 	for(let i = 1; i < this.chain.length; i++) {
// 		const curentBlock = this.chain[i]
// 		const previousBlock = this.chain[i-1]

// 		if(!curentBlock.hasValidTransactions()) {
// 			return false
// 		}

// 		if(curentBlock.hash !== curentBlock.calculateHash()) {
// 			return false
// 		}
// 		if(curentBlock.previousHash !== previousBlock.hash) {
// 			return false
// 		}
// 	}
// 	return true
// }

// BlockChain.prototype.createUser = function(user) {
// 	let userBlock = new UserBlock(user)
// 	userBlock.previousHash = this.getLastUser().hash
// 	user.signRegister(ec.keyFromPrivate(user.private_key))
// 	userBlock.mineBlock(2)
// 	this.userChain.push(userBlock)
// }

// BlockChain.prototype.isValidUserData = function() {
// 	for(let i = 1; i < this.userChain.length; i++) {
// 		const curentBlock = this.userChain[i]
// 		const previousBlock = this.userChain[i-1]

// 		if(!curentBlock.hasValid()) {
// 			return false
// 		}

// 		if(curentBlock.hash !== curentBlock.calculateHash()) {
// 			return false
// 		}
// 		if(curentBlock.previousHash !== previousBlock.hash) {
// 			return false
// 		}
// 	}
// 	return true
// }


// module.exports = BlockChain