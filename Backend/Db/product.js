
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
 
});

// Create and export the model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
