const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Plant = require("../models/Plants");
const ForumPost = require('../models/ForumPost');


const router = express.Router();

// Middleware
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

// GET user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const plantCount = await Plant.countDocuments({ userId: req.user.id });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return the user data including followers and following counts
    res.json({
      ...user.toObject(),
      followers: user.followers.length,  // Count of followers
      following: user.following.length,  // Count of following
      plantCount: plantCount
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT update user profile
router.put('/profile', authMiddleware, async (req, res) => {
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
    res.status(500).json({ msg: 'Failed to update profile' });
  }
});


router.put('/update-profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { name, location, bio, experience } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName: name, location, bio, experience },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      name: updatedUser.name,
      fullName: updatedUser.fullName,
      location: updatedUser.location,
      bio: updatedUser.bio,
      experience: updatedUser.experience
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});



// Register route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: '📧 Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ msg: '✅ Registration successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '❌ Server error during registration.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ msg: '❌ يجب تقديم البريد الإلكتروني وكلمة المرور' });
    }

    // Look for user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // Compare password (hashed)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Respond with the token and user details
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (err) {
    console.error("Error logging in:", err);  // Log the error for debugging
    res.status(500).json({ msg: '❌ خطأ في الخادم', error: err.message });
  }
});



router.post('/follow/:id', authMiddleware, async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = req.params.id;

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!targetUser.followers.includes(currentUserId)) {
    targetUser.followers.push(currentUserId);
    currentUser.following.push(targetUserId);
    await targetUser.save();
    await currentUser.save();
  }

  res.json({ msg: 'Followed successfully', newFollowerCount: targetUser.followers.length });
});

router.post('/unfollow/:id', authMiddleware, async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = req.params.id;

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
  currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
  await targetUser.save();
  await currentUser.save();

  res.json({ msg: 'Unfollowed successfully', newFollowerCount: targetUser.followers.length });
});

// Add a new plant
router.post('/plants', authMiddleware, async (req, res) => {
  const { name, notes, type, plantingDate, location, reminderInterval, userId, image } = req.body;

  try {
    const userId = req.user.id;
    const newPlant = new Plant({
      name,
      notes,
      type,
      plantingDate,
      location,
      reminderInterval,
      userId,
      image,
    });

    // Save the new plant to the database
    await newPlant.save();

    // Respond with the saved plant data
    res.json(newPlant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error saving plant' });
  }
});

// Get all plants for the logged-in user
router.get("/plants", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const plants = await Plant.find({ userId });
    res.status(200).json(plants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching plants" });
  }
});

router.put("/plants/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const updatedPlant = await Plant.findOneAndUpdate(
      { _id: id, userId },        // Filter: match by id + user
      req.body,                   // Update data
      { new: true }               // Return the updated document
    );
    
    if (!updatedPlant) {
      return res.status(404).json({ msg: "Plant not found or unauthorized" });
    }

    res.status(200).json(updatedPlant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to update plant" });
  }
});


// Delete a plant
router.delete('/plants/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Get the authenticated user's ID from the JWT token

  try {
    const plant = await Plant.findOneAndDelete({ _id: id, userId }); // Ensure the plant belongs to the user

    if (!plant) {
      return res.status(404).json({ msg: 'Plant not found or not owned by user' });
    }

    res.json({ msg: 'Plant deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error deleting plant' });
  }
});


router.put('/plants/:id/water', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { lastWatered } = req.body;

  try {
    const updatedPlant = await Plant.findOneAndUpdate(
      { _id: id, userId },
      { lastWatered },
      { new: true }
    );

    if (!updatedPlant) {
      return res.status(404).json({ msg: 'Plant not found or not owned by user' });
    }

    res.json({ msg: 'Watering time updated', plant: updatedPlant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error updating watering time' });
  }
});

// POST /plants/:id/progress
router.post("/plants/:id/progress", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { image } = req.body;

  try {
      const plant = await Plant.findOne({ _id: id, userId });
      if (!plant) return res.status(404).json({ msg: "Plant not found" });

      // Initialize array if doesn't exist
      if (!plant.progressImages) plant.progressImages = [];

      // Add image to array
      plant.progressImages.push({ image, date: new Date() });

      await plant.save();
      res.status(200).json({ msg: "Progress image added" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error saving progress image" });
  }
});

// Add this in your auth.js or plants.js route file
router.get("/plants/:id/progress", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const plant = await Plant.findOne({ _id: id, userId });

    if (!plant) {
      return res.status(404).json({ msg: "Plant not found" });
    }

    res.json({ progressImages: plant.progressImages || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch progress images" });
  }
});

router.delete("/plants/:id/progress/:imageId", authMiddleware, async (req, res) => {
  const { id, imageId } = req.params;
  const userId = req.user.id;

  try {
      const plant = await Plant.findOne({ _id: id, userId });

      if (!plant) {
          return res.status(404).json({ msg: "Plant not found" });
      }

      // Remove the image from the progressImages array
      plant.progressImages = plant.progressImages.filter(image => image !== imageId);

      await plant.save();

      res.json({ msg: "Image deleted successfully" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Failed to delete the image" });
  }
});

// Get all forum posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 }); // newest first
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Add a new forum post
router.post('/posts', async (req, res) => {
  const { author, content } = req.body;
  try {
    const newPost = new ForumPost({ author, content });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: 'Error adding post' });
  }
});


module.exports = router;