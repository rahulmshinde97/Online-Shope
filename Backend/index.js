const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }))
const PORT = 5001;

// Import routes
const apiRoutes = require('./Middelware/api');

// MongoDB connection URL
const mongoURL = "mongodb://0.0.0.0:27017/Service";
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Middleware
app.use(bodyParser.json());

app.use(cors()); // Enable CORS for all origins

app.use(cors({
  origin: 'http://localhost:3000' // Update with your frontend URL
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Use routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
