const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path if needed
const authMiddleware = require('../middleware/auth');

// GET user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATE user profile
router.put('/', authMiddleware, async (req, res) => {
  const { fullName, location, bio, experience, avatar } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, location, bio, experience, avatar },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ msg: 'User not found' });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to update profile' });
  }
});

module.exports = router;
