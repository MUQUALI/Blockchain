const Block = require('./block')
const Transaction = require('./transaction')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

function BlockChain() {
	this.chain = [this.createGenesisBlock()]
	this.difficulty = 2
	this.pendingTransactions = []
	this.miningReward = 100
}

BlockChain.prototype.createGenesisBlock = function() {
	return new Block("11/23/2019", "Genesis Block", "0")
}

BlockChain.prototype.getLastBlock = function() {
	return this.chain[this.chain.length - 1]
}

BlockChain.prototype.minePendingTransactions = function(miningRewardAdress) {
	let date = new Date()
	let day = date.getDate() >=10 ? date.getDate() :'0' + date.getDate()
	let month = (date.getMonth() + 1) >=10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)
	let hours = date.getHours() >=10 ? date.getHours() : '0' + date.getHours()
	let minutes = date.getMinutes() >=10 ? date.getMinutes() : '0' + date.getMinutes()
	let seconds = date.getSeconds() >=10 ? date.getSeconds() : '0' + date.getSeconds()

	let curentTime = day + '/' + month + '/' + date.getFullYear() 
	+ ' - ' + hours + ':' + minutes + ':' + seconds + ''
	

	let block = new Block(curentTime, this.pendingTransactions)
	block.previousHash = this.getLastBlock().hash
	block.mineBlock(this.difficulty)

	this.chain.push(block)

	this.pendingTransactions = []
}

BlockChain.prototype.addTransaction = function(transaction) {
	// cai nay de kiem tra khi tao 1 transaction , khac voi trans dc tao ra khi mine block
	if(!transaction.fromAdress || !transaction.toAdress) {
		throw new Error('Transaction must include from and to address')
	}

	if(!transaction.isValid()) {
		throw new Error('Cannot add invalid transaction')
	}
	this.pendingTransactions.push(transaction)
}

BlockChain.prototype.getBalanceOfAdress = function(address) {
	let balance = 0

	for(let block of this.chain) {
		for(let tran of block.transactions) {
			if(tran.fromAdress === address) {
				balance -= tran.amount
			}

			if(tran.toAdress === address) {
				balance += tran.amount
			}
		}
	}

	return balance
}

BlockChain.prototype.isChainValid = function() {
	if(this.chain.length === 1) {
		return true
	}
	for(let i = 1; i < this.chain.length; i++) {
		const curentBlock = Object.assign(new Block, this.chain[i])
		const previousBlock = this.chain[i-1]

		if(!curentBlock.hasValidTransactions()) {
			return false
		}

		if(curentBlock.hash !== curentBlock.calculateHash()) {

			return false
		}
		if(curentBlock.previousHash !== previousBlock.hash) {
			return false
		}
	}
	return true
}


module.exports = BlockChain