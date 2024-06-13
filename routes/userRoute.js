const express = require('express');
const {getUser, addUser, updateUser, getAllUsers, deleteUser, updateMe, deleteMe, getMe} = require('../controllers/userController');
const { signup, login, protect, forgotPassword, resetPassword, updatePassword, restrictTo } = require('../controllers/authController');
//creating router for user
const router = express.Router();


// These are authentication routes so they are put in authController.
router.post('/signup', signup);        // different from rest architecture
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);       
router.patch('/resetPassword/:token', resetPassword);

router.use(protect)  //  Protect all routes that comes after this point, coz middleware runs in sequence
router.patch('/updatePassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'))

router
  .route('/')
  .get(getAllUsers)
  .post(addUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router;