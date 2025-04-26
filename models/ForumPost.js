const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  image: String,
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  title: String,
  category: String,
  content: String,
  image: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: Date,
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: {
    type: [String],
    default: [],
  },
  replies: [replySchema]
})

module.exports = mongoose.model('ForumPost', postSchema);
