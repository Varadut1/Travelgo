const dotenv = require('dotenv');   // for setting up environment variables

dotenv.config({ path: './config.env' });  // assigning variables from config.env file to environment variables

const app = require('./app');    // getting created app object from app.js file

const mongoose = require('mongoose');    // getting mongoose framework

process.on('uncaughtException', err => {
  console.log(err.name, err.message)
  process.exit(1);
})

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)    // database connection uri
mongoose.connect(DB, {        // connecting to mongodb database via password from env variables                 
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false 
}).then(con => {
  console.log('DB connection successfull!');
})


const port = process.env.PORT;   // assigning port from env vars
const server = app.listen(port, () => {         // event loop for incoming requests to app
  console.log(`App running on port ${port}...`);
});


process.on('unhandledRejection', err => {
  console.log(err.name, err.message)
  server.close(()=>{
    process.exit(1);
  });
})
