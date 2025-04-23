const express = require("express");
const multer = require("multer");
const Plant = require("../models/Plant");
const router = express.Router();

// Upload settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// POST /plants
router.post("/", upload.single("plantImg"), async (req, res) => {
  try {
    const {
      name, notes, type, plantingDate,
      lat, lng, reminderInterval, lastWatered, userId
    } = req.body;

    const plant = new Plant({
      name,
      notes,
      type,
      plantingDate,
      location: { lat, lng },
      reminderInterval,
      lastWatered: new Date(lastWatered),
      image: req.file ? `/uploads/${req.file.filename}` : "",
      userId
    });

    await plant.save();
    res.status(201).json(plant);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// GET /plants
router.get("/", async (req, res) => {
  const plants = await Plant.find();
  res.json(plants);
});

module.exports = router;
