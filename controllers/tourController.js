const Tour = require('../models/tourModel')       // getting tourModel from models folder so that the entries during HTTP request follow given schemas.
const APIFeatures = require('./../utils/apiFeatures'); //getting apiFeatures from utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory');
exports.aliasTopTours = (req, res, next) => {           // this is how middleware is created manually where this is called whenever there is a HTTP request made so that it runs first before any method. It must have req, res and next next is for calling and continuing event loop or transfer control to the controller function
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields='name,price,ratingsAverage,summary,difficulty';
  // if (!req.body.name || !req.body.price) {
  //   return res.status(400).json({
  //     status: 'Failed',
  //     message: 'Bad Request',
  //   });
  // }
  next();
};

exports.getAllTours = getAll(Tour) //catchAsync(async (req, res, next) => {
//     const features = new APIFeatures(Model.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//     const alltours = await features.query;
//     // const alltours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
    
//     res.status(200).json({
//       status: "Successed",
//       length: alltours.length,
//       data: {
//         alltours
//       }
//     })
// }); 

exports.getTour = getOne(Tour, { path: 'reviews' })  //catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews')
//     if(!tour){
//       return next(new AppError('No tour found with that id!', 404))
//     }
//     res.status(200).json({
//       status: 'Successed',
//       data: {
//         tour
//       }
//     })
// });


exports.addTour = createOne(Tour) //catchAsync(async(req, res, next) => {
//   const newtour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newtour,
//       }
//     })
// });


exports.updateTour = updateOne(Tour) //catchAsync(async (req, res, next) =>{
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true
//     })
//     if(!tour){
//       return next(new AppError('No tour found with that id!', 404))
//     }
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour
//       },
//     });
// })

exports.deleteTour =  deleteOne(Tour); // catchAsync(async (req, res, next) =>{
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if(!tour){
//       return next(new AppError('No tour found with that id!', 404))
//     }
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
// });


exports.getTourStats = catchAsync(async (req, res, next) => {   // this function is for aggregating documents in collection and find values in totallity
    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage: {$gte: 4.5 } }    // only aggregare those documents whose rating is above given
      },
      {
        $group: {
          _id: {$toUpper: '$difficulty'},          // helps in grouping wrt specific field
          numTours: { $sum: 1 },       // objects below are just the way how to say mongo how to calculate it
          numRatings: {$sum: '$ratingsQuantity'},
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: {$avg: '$price'},
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },                            // after grouping if we want to deal with showing the data we need to use the variables declare during the grouping
      {
        $sort: { avgPrice: 1 }
      },
      // {
      //   $match: { _id: {$ne: 'EASY' } }             // match could be done multiple times too
      // } 
    ])
    res.status(200).json({
      status: 'success',
      data: {
        stats
      },
    });
})


exports.getMonthlyPlan = catchAsync(async(req, res, next) => {
    const year = req.params.year*1;           // getting year
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'                  // in tour document we have array of dates for each tour, says: which dates this tour happens, unwinding means creating basically a document for each one of those dates i.e., 3*9 here
      },
      {
        $match: { startDates:{                // match i.e., only those dates to be aggregated which lies between the year given in request
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }}
      },
      {
        $group: {                               // grouping the document with month of the tour in that year, number of tours in that month and name of the tours in that month
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },
      {
        $addFields: { month: '$_id' }        // adding new field month and giving its value as id
      },
      {
        $project: {                           // projecting and value 0 means don't project the data i.e., _id here
          _id: 0
        }
      },
      {
        $sort: { numTourStarts: -1 }             // sorting based on number of tours in that month in descending order
      },
      // {
      //   $limit: 12
      // }

    ]);
    res.status(200).json({
      status: 'Success',
      length: plan.length,
      data: {
        plan
      }
    })
})
