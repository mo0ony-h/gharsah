const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  experience: { type: String, default: '' },
  avatar: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }]
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
