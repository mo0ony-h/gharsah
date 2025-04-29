const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Plant = require("../models/Plants");
const ForumPost = require('../models/ForumPost');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

// Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from the header
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token

    // Fetch the full user data based on the decoded ID
    const user = await User.findById(decoded.id); // Assuming decoded contains 'id'
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user; // Assign full user object to req.user
    next(); // Move to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};


// GET user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    const plantCount = await Plant.countDocuments({ userId: req.user.id });
    const postCount = await ForumPost.countDocuments({ author: req.user.id });

    // To count replies, you need to find posts authored by anyone, but replies authored by the user
    const posts = await ForumPost.find({ "replies.author": req.user.id }, { replies: 1 });

    let replyCount = 0;
    posts.forEach(post => {
      replyCount += post.replies.filter(reply => reply.author.toString() === req.user.id).length;
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return the user data including followers and following counts
    res.json({
      ...user.toObject(),
      followersCount: user.followers.length,
      followingCount: user.following.length,
      plantCount,
      postCount,
      replyCount
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to get user profile' });
  }
});

// PUT update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { fullName, location, bio, experience, avatar, username } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, location, bio, experience, avatar, username },
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
  const { fullName, location, bio, experience } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, location, bio, experience },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
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
  const { username, email, password } = req.body;

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: '📧 The email is already registered.' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ msg: '👤 The username is already taken.' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the new user to the database
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
    const { email, username, password } = req.body;
    
    // Check if either email or username and password are provided
    if ((!email && !username) || !password) {
      return res.status(400).json({ msg: '❌ يجب تقديم البريد الإلكتروني أو اسم المستخدم وكلمة المرور' });
    }

    let user;

    // If email is provided, search by email, otherwise by username
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await User.findOne({ username: username.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ msg: '❌ البريد الإلكتروني/اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Compare password (hashed)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: '❌ البريد الإلكتروني/اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Respond with the token and user details
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username, // Include username in the response
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

  // Send the updated following count for the current user
  const updatedFollowingCount = currentUser.following.length;

  res.json({ 
    msg: 'Followed successfully',
    newFollowerCount: targetUser.followers.length,
    newFollowingCount: updatedFollowingCount
  });
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

  // Send the updated following count for the current user
  const updatedFollowingCount = currentUser.following.length;

  res.json({ 
    msg: 'Unfollowed successfully',
    newFollowerCount: targetUser.followers.length,
    newFollowingCount: updatedFollowingCount
  });
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

router.delete("/plants/:plantId/progress/:imageId", authMiddleware, async (req, res) => {
  const { plantId, imageId } = req.params;
  const userId = req.user.id;

  try {
    const plant = await Plant.findOneAndUpdate(
      { _id: plantId, userId }, 
      { $pull: { progressImages: { _id: imageId } } },
      { new: true }
    );

    if (!plant) {
      return res.status(404).json({ message: "Plant not found or not owned by user" });
    }

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server error while deleting image" });
  }
});


// Get all forum posts
router.get('/posts', async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    const posts = await ForumPost.find(query)
      .populate({
        path: 'author',
        select: 'username'
      })
      .populate({
        path: 'replies.author',
        select: 'username'
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});




// Post a new forum entry
router.post('/posts', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, category, content } = req.body;
  const image = req.file ? req.file.buffer.toString('base64') : null;

  try {

    const newPost = new ForumPost({
      title,
      category,
      content,
      image,
      author: req.user._id,
      createdAt: new Date(),
      likes: 0,
      replies: []
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post' });
  }
});



// Like a post
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Ensure likedBy is an array
    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const userId = req.user.id;

    if (post.likedBy.includes(userId)) {
      // If already liked, unlike it
      post.likes = Math.max(0, post.likes - 1); // prevent negative likes
      post.likedBy = post.likedBy.filter(id => id !== userId);
    } else {
      // If not liked yet, like it
      post.likes += 1;
      post.likedBy.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});



// Reply to a post
router.post('/posts/:id/reply', authMiddleware, upload.single('image'), async (req, res) => {
  const { content } = req.body;
  const image = req.file ? req.file.buffer.toString('base64') : null;

  if (!content) {
    return res.status(400).json({ error: 'Content is required for the reply' });
  }

  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = {
      content,
      image,
      author: req.user._id,
      createdAt: new Date(),
      score: 0,
    };

    post.replies.push(reply);
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reply to post' });
  }
});


// DELETE a post
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id; // Assuming you have authentication middleware

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'المنشور غير موجود' });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذا المنشور' });
    }

    await ForumPost.findByIdAndDelete(postId);

    res.json({ message: 'تم حذف المنشور بنجاح' });

  } catch (err) {
    console.error('Delete Post Error:', err);
    res.status(500).json({ error: 'خطأ في حذف المنشور' });
  }
});

// DELETE a reply
router.delete('/posts/:postId/reply/:replyId', authMiddleware, async (req, res) => {
  try {
    const { postId, replyId } = req.params;
    const userId = req.user.id;

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'المنشور غير موجود' });
    }

    const reply = post.replies.id(replyId); // This will get the reply object from the replies array
    if (!reply) {
      return res.status(404).json({ error: 'الرد غير موجود' });
    }

    // Check if the logged-in user is the author of the reply
    if (reply.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذا الرد' });
    }

    // Remove the reply from the post
    post.replies.pull({ _id: replyId });
    await post.save();


    res.json({ message: 'تم حذف الرد بنجاح' });

  } catch (err) {
    console.error('Delete Reply Error:', err);
    res.status(500).json({ error: 'خطأ في حذف الرد' });
  }
});




module.exports = router;