const express = require('express');    // importing express framework
const {getAllTours, addTour, updateTour, deleteTour, getTour, aliasTopTours, getTourStats, getMonthlyPlan} = require('../controllers/tourController');         // getting all required functions from controller
const { protect, restrictTo } = require('../controllers/authController');
const { createReview, getReview } = require('../controllers/reviewController');
const router = express.Router();          // creating router object so that on it HTTP methods are called
// router.param('id', checkId);
const reviewRouter = require('./reviewRoute')


router.use('/:tourId/reviews', reviewRouter)

router 
  .route('/top-5-cheap')            // alias route
  .get(aliasTopTours, getAllTours)  // here i have used alisaTopTours as middleware where i am going to provide query by default so that user need not take extra efforts for it.
router
  .route('/')                  // assigning one of its route as / so that any request made on '/' has get and post method
  .get(getAllTours)           // calling get function with passing getTour as controller function so that when get request is made it automatically transfers the controll to the getAllTours function
  .post(protect, restrictTo('admin', 'lead-guide'), addTour);

router
  .route('/monthly-plan/:year')
  .get(protect, 
    restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan)
router
  .route('/tour-stats')
  .get(getTourStats)
router
  .route('/:id')            // assigning one of its route as /:id so that any request made on '/:id' has get, post, patch, delete method
  .get(getTour)            
  .patch(protect, 
    restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, 
    restrictTo('admin', 'lead-guide'), 
    deleteTour)

router.route('/:tourId/reviews')
  .post(protect, restrictTo('user'), createReview)
  .get(getReview)



module.exports = router;