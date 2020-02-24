const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	full_name: String,
	pub_key: String,
	private_key: String,
	is_charity: Boolean,
	charity_credit: String,
	charity_bank: String,
	charity_phone: String
})

const User = mongoose.model('User', userSchema, 'users')

module.exports = User