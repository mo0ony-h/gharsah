const mongoose = require('mongoose');

const ForumPostSchema = new mongoose.Schema({
  author: String,
  content: String,
}, { timestamps: true });

module.exports = mongoose.model('ForumPost', ForumPostSchema);
