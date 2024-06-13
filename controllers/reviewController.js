const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory');

exports.getReview = getAll(Review) //catchAsync(async (req, res, next)=>{
//     let filter;
//     if(req.params.tourId) {
//         filter = {
//             tour: req.params.tourId
//         }
//     }
//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         data: reviews
//     })
// })

exports.setTourUserIds = (req, res, next) => {
    req.body.user = req.user.id;
    if(!req.body.tour){
        req.body.tour = req.params.tourId
    }
    next();
}

exports.createReview = createOne(Review) //catchAsync(async (req, res, next) => {
    
//     const result = await Review.create(
//         req.body
//     );

//     res.status(200).json({
//         status: 'success',
//         data: result
//     })
// })

exports.deleteReview = deleteOne(Review);

exports.updateReview = updateOne(Review);

exports.getOneReview = getOne(Review);