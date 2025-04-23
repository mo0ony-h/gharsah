const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: String,
  notes: String,
  type: String,
  plantingDate: Date,
  location: { lat: Number, lng: Number },
  reminderInterval: Number,
  lastWatered: { type: Date, default: null },  
  progressImages: ["data:image/jpeg;base64,...", "data:image/png;base64,..."],
  image: String,
  userId: { type: mongoose.Schema.Types.ObjectId,ref: "User", required: true }
});

module.exports = mongoose.model("Plant", plantSchema);

