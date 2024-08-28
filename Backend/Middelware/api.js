const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors')
const Product = require('../Db/product'); // Adjust path as necessary
const User = require('../Db/users'); // Adjust path as necessary
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const users = require('../Db/UserInfo')
const bcrypt = require('bcrypt');
const contactDetails=require("../Db/ContectDetails")
//const cors =require('cors')

const router = express.Router();
router.use(cors())

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create a new product
router.post('/products', upload.single('image'), async (req, res) => {
  const { name, price } = req.body;
  const image = req.file ? req.file.path : '';

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const product = new Product({ name, price, image });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new user
router.post('/user', async (req, res) => {
  const { name, email, number } = req.body;

  if (!name || !email || !number) {
    return res.status(400).json({ error: 'Name, email, and number are required' });
  }

  try {
    const user = new User({ name, email, number });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by email
router.post('/users', async (req, res) => {
  const { email } = req.body
  console.log(req.body)
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, number } = req.body;

  if (!name || !email || !number) {
    return res.status(400).json({ error: 'Name, email, and number are required' });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { name, email, number }, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Function to generate OTP
function generateOtp(length = 6) {
  // Ensure the length is at least 1 to prevent invalid results
  if (length < 1) {
    throw new Error('Length must be at least 1');
  }

  // Generate a random number as a string
  const otp = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');

  return otp;
}

// Function to send OTP email
async function sendOtpEmail(recipientEmail, otp) {
  console.log(recipientEmail, otp)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'shinde.rahul0297@gmail.com', // Your email address
      pass: 'rhdx koxs xaul oumv' // Your email password or app-specific password
    }
  });

  const mailOptions = {
    from: 'shinde.rahul0297@gmail.com',
    to: recipientEmail,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for 10 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', emailError);
      if (emailError.code === 'ENOTFOUND') {
        res.status(500).json({ error: 'Network issue: Unable to reach email server' });
      } else {
        res.status(500).json({ error: 'Failed to send OTP email' });
      }
}
}


// API endpoint to request OTP
router.post('/request-otp', async (req, res) => {
  const { name, email, number, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Generate OTP and expiry time
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Find user by email
    let user = await users.findOne({ email });

    if (!user) {
      // Create new user if not found
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new users({ name, email, number, password: hashedPassword });
      user.otp = otp;
      user.otpExpiry = otpExpiry;

      // Save the user (update if existing, create if new)
      await user.save();

      // Send OTP email
      const result = await sendOtpEmail(email, otp);

      if (result.success) {
        res.status(200).json({ message: 'OTP sent successfully' });
      } else {
        res.status(500).json({ error: result.error });
      }
    } else {
      return res.status(409).json({ error: 'email already exist' });
    }

    // Update OTP and expiry time

  } catch (error) {
    console.error('Error handling OTP request:', error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Error handling OTP request' });
  }
});
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    // Find the user by email
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.otp === otp && new Date(user.otpExpiry) > new Date()) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      res.status(200).json({ message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Error verifying OTP' });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await users.findOne({ email });
    console.log(user)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Authentication successful
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.post("/password", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the password' });
  }
});
router.post("/sendOtp", async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email required' })
  }
  try {
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } else {


      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      // Save OTP and expiration to the user
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      const result = await sendOtpEmail(email, otp);

      if (result.success) {
        res.status(200).json({ message: 'OTP sent successfully' });
      } else {
        res.status(500).json({ error: result.error });
      }
    }

  } catch (error) {
    res.status(500).json({ error: 'An error occurred while sending OTP' });
  }
})
router.post('/getuser', async (req, res) => {
  const { email } = req.body
  console.log(email)
  if (!email) {
    return res.status(400).json({ error: 'Email required' })
  }
  try {
    const user = await users.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } else {
      res.status(201).json(user); 
    }

  } catch (error) {
    return res.status(404).json({ error});
  }
})

router.post("/details", async (req, res) => {
  const { name, locationDetail, state, pinCode, townOrCity, mobile, productName, productPrice ,productImage,email} = req.body;
console.log(name, locationDetail, state, pinCode, townOrCity, mobile, productName, productPrice ,productImage,email)
  // Check if all required fields are present
  if (!name || !locationDetail || !state || !pinCode || !townOrCity || !mobile || !productName || !productPrice || !productImage || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }
   products=[{
    productName:productName,
    productPrice:productPrice,
    productImage:productImage
   }]
  
    // Find the existing contact details entry by mobile number
    try{
    let details = await contactDetails.findOne({ email});

    if (details) {
      // Entry exists, update it
      details.products = [...details.products, ...products]; // Append new products
      details.name = name; // Optionally update other fields if needed
      details.locationDetail = locationDetail;
      details.state = state;
      details.email=email
      details.pinCode = pinCode;
      details.townOrCity = townOrCity;
    } else {
      // Entry does not exist, create a new one
      details = new contactDetails({
        name,
        mobile,
        locationDetail,
        email,
        state,
        pinCode,
        townOrCity,
        products
      });
    }

    // Save the document to the database
    const result = await details.save();
    
    // Send success response
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving contact details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})
router.post("/history",async(req,res)=>{
     const {email}=req.body

     if(!email){
      return res.status(400).json({ error: 'need your mobile number' });
     }
     try {
       const result=await contactDetails.findOne( { email })
       if(!result){
        return res.status(201).json("not any history");
       }else{
       res.status(201).json(result);
       }
     } catch (error) {
      
     }
})



module.exports = router;
