const fs = require('fs'); 
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const router = require('../routes/userRoute');
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))

const filterObj = (obj, ...allowedFields) => {
    const newobj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newobj[el] = obj[el];
    })
    return newobj;
}

exports.getAllUsers =  getAll(User) //catchAsync(async(req, res) => {
//     const allusers = await User.find();
//     res.status(200).json({
//         status: "Successed",
//         length: allusers.length,
//         data: {
//             allusers
//         }
//     })
// })
exports.getUser =  getOne(User) //(req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: "Not yet implemented"
//     })
// }

exports.addUser =  createOne(User) //(req, res) => {
//     res.status(500).json({
//         status: 'success',
//         message: "Not implemented"
//     })
//  }


exports.updateUser = updateOne(User) //(req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'Not implemented'
//     })
// }

exports.deleteUser = deleteOne(User) //(req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'Not implemented'
//     })
// }

exports.updateMe = catchAsync(async(req, res, next) => {
    // create error if user posts password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates. Please use /updatePassword', 400))
    }

    const filteredbody = filterObj(req.body, 'name', 'email');

    const user = await User.findByIdAndUpdate(req.user.id, filteredbody, {
        new:true, 
        runValidators: true
    });
    // await user.save();


    res.status(200).json({
        status: 'success', 
        data: {
            user
        }
    })
})


exports.deleteMe = catchAsync(async(req, res, next) => {
    // create error if user posts password data
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
})


exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}
