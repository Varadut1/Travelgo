const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const sendEmail = require('../utils/email');
const crypto = require('crypto')
const correctPassword = require('../models/userModel')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  };

  
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
    res.cookie('jwt', token, cookieOptions);
  
    // Remove password from output
    user.password = undefined;
  
    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  };

exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create(
        req.body
    );
    createSendToken(newUser, 201, res);
});


exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
})

exports.protect = catchAsync(async(req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    // getting token
    // console.log(token);
    // verifying token
    if(!token){
        return next(new AppError('You are not logged in! Please login again.', 401))
    }
    // if success check user exists
    
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // check if user changed password after token was issued
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new AppError('The user belonging to token no longer exists', 401));
    }
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed the password! Please log in again'), 401)
    }

    req.user = freshUser;
    next();
})






//

exports.restrictTo = (...roles) =>{
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action!'))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
   // Get user with email

   const user = await User.findOne({email: req.body.email})
    if(!user){
      return next(new AppError("No user with the email address.", 404));
    }
   // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
   // Send it to user's email
  //  next();
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
  const message = `Forgot your Password? Submit a PATCH request with your new Password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  
  try{
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 mins!!!)',
      message
    })
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    })
  }
  catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!'), 500)
  }
  
})

exports.resetPassword = catchAsync(async(req, res, next) => {
  // Get user based on token 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})
  // If token is not expired and user is present then set new password
    if(!user){
      return next(new AppError('Token is invalid or has expired!', 400))
    }
  // Update ChangedPassword property for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;


    await user.save(); 
  // log the user and send JWT
  createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async(req, res, next) => {
  // get user from collection
  const { currentpassword, password, passwordConfirm } = req.body;
  const user = await User.findById(req.user.id).select('+password'); 
  if(!user){
    return next(new AppError('No authorized user found! Please signup to create new account', 401));
  }
  // check if posted password is correct
  if(!(await user.correctPassword(currentpassword, user.password))){
    return next(new AppError('The password provided was not correct, please provide the correct password to change it!'));
  } 

  //  all above correct then update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // log user and send jwt
  createSendToken(user, 201, res);
})