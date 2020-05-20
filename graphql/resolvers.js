const path = require('path');
const fs = require('fs');


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
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}

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

		const user = await User.findById(req.userId);
		if(!user) {
			const error = new Error('Not Authorized');
			error.statusCode = 401;
			throw error;
		}

		const post = new Post({
			title: title,
			content: content,
			imageUrl: imageUrl,
			creator: user
		});

		const createdPost = await post.save();
		user.posts.push(createdPost);
		await user.save();
		return {
			...post._doc, 
			_id: post._id.toString(),
			createdAt: post.createdAt.toString(),
			updatedAt: post.updatedAt.toString()
		};
	},
	getPosts: async function({ page }, req) {
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}
		page = (page !== undefined) ? page : 1;
		const perPage = 2;
		
		const totalPosts = await Post.find().countDocuments();
		const posts = await Post
							.find()
							.sort({ createdAt: -1 })
							.skip((page - 1)*perPage)
							.limit(perPage)
							.populate('creator');
		
		return {
			posts_array: posts.map(p =>  {
				return { 
					...p._doc, 
					_id: p._id.toString(), 
					createdAt: p.createdAt.toISOString(),
					updatedAt: p.updatedAt.toISOString()
				}
			}),
			totalPosts: totalPosts
		}
	},
	post: async function({ id }, req) {
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}

		const post = await Post.findById(id).populate('creator');
		if(!post) {
			const error = new Error('No Post Found!');
			error.statusCode = 404;
			throw error;
		}

		return {
			...post._doc,
			_id: post._id.toString(),
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.createdAt.toISOString()
		}
	},
	updatePost: async function({ id, postInput }, req) {
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}
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

		//find post
		const post = await Post.findById(id).populate('creator');
		if(!post) {
			const error = new Error('Post Not Found !');
			error.statusCode = 404;
			throw error;
		}
		//check if the user is same as who created it
		if(post.creator._id.toString() !== req.userId) {
			const error = new Error('Not Authorized');
			error.statusCode = 403;
			throw error;
		}

		//update posts
		post.title = title;
		post.content = content;
		if(imageUrl !== 'undefined') {
			post.imageUrl = imageUrl;
		}

		const updatedPost = await post.save();
		return {
			...updatedPost._doc,
			_id: updatedPost._id.toString(),
			createdAt: updatedPost.createdAt.toISOString(),
			updatedAt: updatedPost.updatedAt.toISOString()
		}
	},
	deletePost: async function({ id }, req) {
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}

		const post = await Post.findById(id).populate('creator');
		if(!post) {
			const error = new Error('Post Not Found !');
			error.statusCode = 404;
			throw error;
		}
		//check if the user is same as who created it
		if(post.creator._id.toString() !== req.userId) {
			const error = new Error('Not Authorized');
			error.statusCode = 403;
			throw error;
		}

		clearImage(post.imageUrl);
		await Post.findByIdAndRemove(id);
		const user = await User.findById(req.userId);
		user.posts.pull(id);
		await user.save();
		return true;
	},
	user: async function(args, req) {
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}

		const user = await User.findById(req.userId);
		if(!user) {
			const error = new Error('User Not Found !');
			error.statusCode = 404;
			throw error;
		}

		return {
			...user._doc,
			_id: user._id.toString()
		}
	},
	updateStatus: async function({ status }, req) {
		if(!req.isAuth) {
			const error = new Error('Authentication Failed');
			error.statusCode = 401;
			throw error;
		}

		const user = await User.findById(req.userId);
		if(!user) {
			const error = new Error('User Not Found !');
			error.statusCode = 404;
			throw error;
		}

		user.status = status;
		await user.save();
		return {
			...user._doc,
			_id: user._id.toString()
		}
	}
};


const clearImage = filePath => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, err => console.log(err));
};