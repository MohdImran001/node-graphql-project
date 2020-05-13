//RESOLVERS FOR TYPE DEFINITIONS
const bcrypt = require('bcrypt');
const v = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
	createUser: async function({ userInput }, req) {
		const email = userInput.email;
		const password = userInput.password;
		const name = userInput.name;

		//Error Handling
		const errors = [];
		if(!v.isEmail(email)) {
			errors.push({ message: "E-mail is invalid !" });
		}
		if(!v.isLength(password, { min: 5 })) {
			errors.push({ message: "password is too short!" });
		}
		if(errors.length > 0) {
			const error = new Error('Invalid Input');
			error.data = errors;
			error.statusCode = 422;
			throw error;
		}

		//checking user in DB
		const existingUser = await User.findOne({ email: userInput.email });
		if(existingUser) {
			const error = new Error('user already exists!');
			error.statusCode = 422;
			throw error;
		}
		
		//creating a user
		const hashedPw = await bcrypt.hash(userInput.password, 12);
		const user = new User({
			email: userInput.email,
			password: hashedPw,
			name: userInput.name
		});
		const createdUser = await user.save();

		return { ...createdUser._doc, _id: createdUser._id.toString() };
	},
	login: async function ({ email, password }, req) {
		const user = await User.findOne({ email: email });
		if(!user) {
			const error = new Error('User Not Found!');
			error.statusCode = 404;
			throw error;
		}

		const isEqual = await bcrypt.compare(password, user.password);
		if(!isEqual) {
			const error = new Error('wrong password');
			error.statusCode = 401;
			throw error;
		}

		const token = await jwt.sign({
			email: user.email,
			userId: user._id.toString()
		}, 'mysupersecretsecret');

		return { token: token, userId: user._id.toString() };
	},
	createPost: async function ({postInput}, req) {
		const title = postInput.title;
		const content = postInput.content;
		const imageUrl = postInput.imageUrl;

		//Error Handling
		const errors = [];
		if(!v.isLength(title, { min: 5 })) {
			errors.push({ message: "title is too short !" });
		}
		if(!v.isLength(content, { min: 5 })) {
			errors.push({ message: "content is too short" });
		}
		if(errors.length > 0) {
			const error = new Error('Invalid Input');
			error.data = errors;
			error.statusCode = 422;
			throw error;
		}

		const post = new Post({
			title: title,
			content: content,
			imageUrl: imageUrl
		});

		post = await post.save();
		return {
			...post._doc, 
			_id: post._id.toString(),
			createdAt: post.createdAt.toString(),
			updatedAt: post.updatedAt.toString()
		};
	}
};;