const express = require('express');
const auth = require('../middleware/authMiddleware'); // Middleware to protect routes
const User = require('../models/User') // Assuming you have a User model

const router = express.Router();

// Route to get user details
router.get('/profile', auth, async (req, res) => {
  try {
    // Find the user by ID, which is available in req.user.id from the token
    const user = await User.findById(req.user.id).select('-password'); // Exclude the password field
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user); // Send user data as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
