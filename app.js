const express = require('express');    // creating express object 
 
const app = express();               // creating app object from express framework
   
const morgan = require('morgan');  // logging HTTP request it is a middleware

const rateLimit  = require('express-rate-limit')

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize')

const xss = require('xss-clean')

const hpp = require('hpp');

app.use(helmet());
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
app.use(morgan('dev'));           // concise and colorful logging output

// if(process.env.NODE_ENV == 'production'){

// }

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
})

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));         // making data available in the request.body object

// Data Sanitization against NOSQL query injection 
app.use(mongoSanitize());
// Data Sanitization agianst XSS
app.use(xss());

// Prevent parameter polution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

app.use(express.static(`${__dirname}/public`));   // static file directory

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

const tourRouter = require('./routes/tourRoute');    // importing created tourRoute
app.use('/api/v1/tours', tourRouter);              // assigning base route to this tourRouter

const userRouter = require('./routes/userRoute');  // importing created userRoute
app.use('/api/v1/users', userRouter);              // assigning base route to this userRouter
 
const reviewRouter = require('./routes/reviewRoute');  // importing created userRoute
app.use('/api/v1/reviews', reviewRouter); 

app.all('*', (req, res, next) => {    // middleware that catches non matched url for an ip address as root
    next(new AppError(req.originalUrl + ' is not right', 404));   // if there is argument in next function then it will skip all middlewares and call error handeling middleware, this is its way to recongnising that error has occured
})

app.use(globalErrorHandler)  // errorController

module.exports = app;                            // exporting app so that event loop could be called on it in server.js file