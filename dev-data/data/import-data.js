const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const fs = require('fs');

const Tour = require('./../../models/tourModel')
const Review = require('./../../models/reviewModel')
const User = require('./../../models/userModel')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false 
}).then(con => {
  console.log('DB connection successful!');
})


const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importdata = async () => {
    try{
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Added!')
        process.exit();
    }
    catch(err){
        console.log(err);
    }
}

const deletedata = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Deleted')
        process.exit();
}

    catch(err){
        console.log(err);
    }
}

if(process.argv[2] == '--import'){
    importdata();
}
else if(process.argv[2] == '--delete'){
    deletedata();
}