const jwt = require('jsonwebtoken');

// function errorHandler(message, statusCode) {
// 	const error = new Error(message);
// 	error.statusCode = statusCode;
// 	throw error;
// }

module.exports = (req, res, next) => {
	const authHeader = req.get('Authorization');
	if(!authHeader) {
		req.isAuth = false;
		return next();
	}
	
	const token = authHeader.split(' ')[1];
	
	let decodedToken;
	try {
		decodedToken = jwt.verify(token, 'mysupersecretsecret');
	} catch {
		req.isAuth = false;
		return next();	
	}

	if(!decodedToken) {
		req.isAuth = false;
		return next();
	}

	req.userId = decodedToken.userId;
	req.isAuth = true;
	next();
}