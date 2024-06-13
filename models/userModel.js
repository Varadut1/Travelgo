const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name'],
    // trim: true,
    // validate: [validator.isAlpha, 'Tour name must only have characters'] // doesnot allow spaces that's why commented
  },
  email: {
    type: String, 
    required: [true, 'Email is required to get logged in'],
    unique: [true, 'Email already used'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provid validate email']
  },
  photo: {
    type: String,
    required: [false, 'Photo is optional']
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Password is required for your account'],
    minlength: [8, 'Password must be atleast 8 letters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'You need to confirm your password in order to log in'],
    validate: {   // Only works on .create or .save;
        validator: function(pass){
            return this.password === pass;
        },
        message: 'Confirmation should match the password input'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
}
  ,{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });


  userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12); // hashing
    this.passwordConfirm = undefined;  // not persisting with password confirm
    next();
  })



  userSchema.methods.correctPassword = async function(can, user){
    return await bcrypt.compare(can, user)
  };

  userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
      console.log(changedTimestamp, JWTTimestamp)
      return changedTimestamp > JWTTimestamp;
    }

    return false;
  }

  userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({resetToken}, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
  }

  userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew)  return next();

    this.passwordChangedAt = Date.now() - 1000;  // subtracting 1 sec will make sure that token is created after the password is changed.
    next();
  })

  userSchema.pre(/^find/, function(next){ 
    this.find({ active: {$ne: false} });
    next();
  })


  const User = mongoose.model('User', userSchema);
  module.exports = User;







