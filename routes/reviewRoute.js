const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const { getReview, createReview, deleteReview, updateReview, setTourUserIds, getOneReview } = require('../controllers/reviewController');
const router = express.Router({ mergeParams: true });

// getting
router.use(protect);
router
    .route('/')
    .get(getReview)
    .post(restrictTo('user'), setTourUserIds, createReview);

router.route('/:id')
    .delete(restrictTo('user', 'admin'), deleteReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .get(getOneReview);

// uploading

module.exports = router;