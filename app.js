const path = require('path');

//third-party dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const graphqlHttp = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');

//initializing express app
const app = express();


//multer config
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	}
})

const fileFilter = (req, file, cb) => {
	if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true);
	}
	else {
		cb(null, false);
	}
}


//middlewares
app.use((req, res, next) => {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
   res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, Authorization');
   if(req.method === 'OPTIONS')
   		return res.sendStatus(200);
   next();
});

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));


app.use('/graphql', graphqlHttp({
	schema: graphqlSchema,
	rootValue: graphqlResolvers,
	graphiql: true,
	customFormatErrorFn (err) {
		if(!err.originalError)
			return err;

		const message = err.message || 'An Error Occured';
		const code = err.originalError.statusCode || 500;
		const data = err.originalError.data;
		return { message: message, statusCode: code, data: data };
	}
}));



//ERROR HANDLER
app.use((err, req, res, next) => {
	console.log(err);
	const statusCode = err.statusCode || 500;
	const data = err.data || null;
	res.status(statusCode).json({
		"message" : err.message,
		"data": data
	})
})


mongoose
.connect(
, 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(result => {
	//server
	app.listen(8080, () => {
    	console.log("server started");
	});
})





