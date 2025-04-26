const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: String,
  notes: String,
  type: String,
  plantingDate: Date,
  location: { lat: Number, lng: Number },
  reminderInterval: Number,
  lastWatered: { type: Date, default: null },  
  progressImages: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      image: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ],
  image: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});


module.exports = mongoose.model("Plant", plantSchema);

