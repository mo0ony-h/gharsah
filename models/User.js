const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  experience: { type: String, default: '' },
  avatar: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }],
  postCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
