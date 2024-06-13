const mongoose = require('mongoose');
const Tour = require('./tourModel');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema({
    review:{
        type: String,
        required: [true, 'Review must contain text!'],
        maxlength: [500, 'Only Maximum of 500 characters aloud!'],

    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Review must have rating']
    },
    createdAt: {type: Date, default: Date.now},
    tour: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'Review must have corresponding Tour'],
        ref: 'Tour'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'Review must have corresponding User'],
        ref: 'User'
    } 
}, {
    toJSON:  {virtuals: true},
    toObject: {virtuals: true}
})


reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // compound index set to unique

reviewSchema.pre(/^find/, function(next){
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
})

reviewSchema.statics.calcAverageRatings = async function(tourId){
    const stats = await this.aggregate([
      {
        $match: {tour: tourId}
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating'}
        }
      } 
    ])
    console.log(stats);
    if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating
    })}
    else{
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5
    })}
  }
  
  reviewSchema.post('save', function(){
    this.constructor.calcAverageRatings(this.tour);
  }) 

  reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne();
    console.log(this.r);
    next(); 
  }) 

  reviewSchema.post(/^findOneAnd/, async function(next){
    await this.r.constructor.calcAverageRatings(this.r.tour)
  }) 
const Review = mongoose.model('Review', reviewSchema);


module.exports = Review;