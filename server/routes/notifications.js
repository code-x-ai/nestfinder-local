const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const mongoose = require('mongoose'); // for ObjectId validation

// 1. CREATE NOTIFICATION
router.post('/', async (req, res) => {
  try {
    const newNotif = new Notification(req.body);
    const savedNotif = await newNotif.save();
    res.status(200).json(savedNotif);
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. GET NOTIFICATIONS
router.get('/:email', async (req, res) => {
  try {
    const notifs = await Notification.find({ ownerEmail: req.params.email }).sort({ createdAt: -1 });
    res.status(200).json(notifs);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE NOTIFICATION
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;