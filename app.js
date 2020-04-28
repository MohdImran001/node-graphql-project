const path = require('path');

//third-party dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

//custom modules
const feedRoutes = require('./routes/feed');

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
   next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));




//routes
app.use('/feed', feedRoutes);


//ERROR HANDLER
app.use((err, req, res, next) => {
	console.log(err);
	const statusCode = err.statusCode || 500;
	res.status(statusCode).json({
		"message" : err.message
	})
})


mongoose
.connect(
	'mongodb+srv://USERNAME:PASSWORD@cluster0-gudn3.mongodb.net/DATABASE?retryWrites=true&w=majority'
)
.then(result => {
	//server
	app.listen(8080, () => {
    	console.log("server started");
	});
})





