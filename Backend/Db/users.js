const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const User = new Schema({
  name: {
    type: String,
    //required: true
  },
  email: {
    type: String,
    //required: true
  },
  number: {
    type: Number
  },
 
});

// Create and export the model
const Users = mongoose.model('users', User);
module.exports = Users;