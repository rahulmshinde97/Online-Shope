const mongoose = require('mongoose');

// Define the schema for the product
const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    
    productPrice: {
        type: Number,
        required: true,
        min: 0
    },
    productImage:{
        type:String
    },
    date:{
        type: Date,
        default: () => new Date() 
    }
});

// Define the schema for contact details
const contactDetailsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 15
    },
    locationDetail: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String
    },
    pinCode: {
        type: String,
        required: true,
        trim: true
    },
    townOrCity: {
        type: String,
        required: true,
        trim: true
    },
    products: [productSchema], // Array of products
    paymentMethod: {
        type: String,
        enum: ['cash', 'card'], // Include other payment methods if needed
        default: 'cash',
        required: true,
      },
      cardNumber: {
        type: String,
        validate: {
          validator: function(value) {
            // Card number is required only if paymentMethod is 'card'
            return this.paymentMethod === 'card' ? !!value : true;
          },
          message: 'Card number is required for card payments.',
        },
      },
      expiryDate: {
        type: String,
        validate: {
          validator: function(value) {
            // Expiry date is required only if paymentMethod is 'card'
            return this.paymentMethod === 'card' ? !!value : true;
          },
          message: 'Expiry date is required for card payments.',
        },
      },
      cvv: {
        type: String,
        validate: {
          validator: function(value) {
            // CVV is required only if paymentMethod is 'card'
            return this.paymentMethod === 'card' ? !!value : true;
          },
          message: 'CVV is required for card payments.',
        },
      },
}, { timestamps: true });

// Create and export the model
const ContactDetails = mongoose.model('ContactDetails', contactDetailsSchema);

module.exports = ContactDetails;
