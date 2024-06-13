const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'Name of each tour must be unique'],
      trim: true,
      maxlength: [40, 'A tour must have less or equal to 40 chars'],
      minlength: [10, 'A tour must have greater or equal to 10 chars'],
      // validate: [validator.isAlpha, 'Tour name must only have characters'] // doesnot allow spaces that's why commented
    },
    slug: String,
    duration: {
        type: Number, 
        required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
        type: Number, 
        required: [true, 'A tour must have a max groups size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
          values: ['easy', 'medium', 'difficult'],
          message: "Difficulty should be either easy, medium or difficult"
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating mmust be above 1.0'],
      max: [5, 'Rating must be below 5'],
      set: value => Math.round(value * 10) / 10
    },
    ratingsQuantity: {
        type: Number, 
        default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a name']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val){
          return val<this.price;  // this works only when creating not while updating
        },
        message: 'Discount Price must be greater than {VALUE}'
    }
    }, 
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have description']
    },
    description : {
        type: String,
        trim: true
    },
    imageCover: {
        type: String, 
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
      type:{
        type: String, default: 'Point',
        enum: ['Point']
      },
      coordinates:  [Number],
      address: String,
      description: String
    },
    locations: [{
      type: {
        type: String,
        default: 'Point',
        enums: ['Point']
      },
      coordinates:  [Number],
      address: String,
      description: String,
      day: Number
    }],
    guides: [
      {
        type: mongoose.Schema.ObjectId, 
        ref: 'User'
      }
    ]
  }, { 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  tourSchema.index( {price: 1, ratingsAverage: -1});
  tourSchema.index({slug: 1});

  tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;        // arrow function dont get this keyword 
  })

  tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
  })
  

  //mongoose middleware

  tourSchema.pre('save', function(next){    // document middleware which runs before saving document, and creating document but not insermany
    this.slug = slugify(this.name, {lower: true});
    next();
  })

  // tourSchema.pre('save', async function(next){
  //   const guidesPromise = this.guides.map( async id => await User.findById(id) )
  //   this.guides = await Promise.all(guidesPromise);
  //   next();
  // })
//   tourSchema.post('save', function(doc, next){
//     console.log(doc);
//     next();
//   })

// Query Middleware

  tourSchema.pre(/^find/, function(next){      // here 'this' is query object
    this.find({ secretTour: {$ne: true }})
    this.start = Date.now()
    next();
  })

  tourSchema.post(/^find/, function(docs, next){      
    console.log(`Query took: ${Date.now()-this.start} ms`);
    // console.log(docs);
    next();
  })

  tourSchema.pre(/^find/, function(next){
    this.populate({
      path: 'guides',
      select: '-__v -passwordChangedAt'
    });
    next();
  })

// Aggregation middleware

tourSchema.pre('aggregate', function(next){
    this.pipeline().unshift({$match: { secretTour: {$ne: true}}})
    console.log(this);
    next();
})


  const Tour = mongoose.model('Tour', tourSchema);
  
  module.exports = Tour;