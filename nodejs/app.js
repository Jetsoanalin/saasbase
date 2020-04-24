const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bodyParser = require("body-parser");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const session = require('express-session');

const { secret } = require('./config');
const getApi = require('./services/ApiService') ;
const clientApiKeyValidation = require('./common/authUtils');
const sessinauth = require('./common/authUtils');


// Importing The Database
const sqldb = require('./sqldb');
const mongodb = require('./mongodb');

// Importing Token Verification
// const VerifyToken = require('./auth/VerifyToken')

// Calling the Routes 
const authRoutes = require('./routes/authRoutes');




// Calling the Error Handlers
const globalErrHandler = require('./controllers/errorController.js');
const AppError = require('./utils/appError');
const app = express();

// Allow Cross-Origin requests
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// API Key Service Call
// const apiService = require('./routes/ApiServiceRoutes');
// app.use(clientApiKeyValidation.clientApiKeyValidation);

// Limit request from the same API 
const limiter = rateLimit({
    max: 150,
    windowMs: 60 * 60 * 1000,
    message: 'Too Many Request from this IP, please try again in an hour'
});
app.use('/api/v1', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({
    limit: '100kb'
}));

// Configure the Session expiry
app.use(
    session({
      secret: secret,
      resave: true,
      saveUninitialized: false
    })
);

// Data sanitization against Nosql query injection
app.use(mongoSanitize());

// Data sanitization against XSS(clean user input from malicious HTML code)
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Setting Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(express.json());
app.use(upload.array()); 
app.use(express.static('public'));


// Setting Up API Key Handler for All System APIs
// app.use(getApi.getApi(process.env.apikey,process.env.uuid));



// Checking and Testing of Home
app.get('/', (req, res) => {
    // console.log(req.session)
    res.send(`You hit home page!\n`)
})
app.get('/home',sessinauth.sessionauth, (req, res) => {
    res.send(`You are seeing this because you have a valid session.
          Your username is ${req.session.user.username} 
          and email is ${req.session.user.email}.`)
})


// Logout from all:
app.all('/logout', (req, res) => {
    delete req.session.user; // any of these works
    req.session.destroy(); // any of these works
    res.status(200).send('logout successful')
})


// Routes
app.use('/api/v1/auth', authRoutes);

// API service creation Route
// app.use('/admin/v1/service',apiService);

// handle undefined Routes
app.use('*', (req, res, next) => {
    const err = new AppError(404, 'fail', 'undefined route');
    next(err, req, res, next);
});

app.use(globalErrHandler);

module.exports = app;