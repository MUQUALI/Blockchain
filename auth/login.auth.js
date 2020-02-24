

module.exports.authLogin = function(req, res, next) {
	if(!req.signedCookies.username) {
		res.redirect('/login')
		return
	}
	next()
}