const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true,
    },
    number:Number,
    password: {
        type: String,
        required: true,
    },
    otp: String,
    otpExpiry: Date,
});



// Method to compare passwords
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('userInfo', userSchema);

module.exports = User;
