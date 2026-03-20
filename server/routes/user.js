const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');

// 1. GET USER PROFILE
router.get('/:email', async (req, res) => {
  try {
    let user = await UserProfile.findOne({ email: req.params.email }).populate('savedListings');
    if (!user) {
      user = new UserProfile({ email: req.params.email });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. UPDATE PROFILE (Added Phone)
router.post('/update', async (req, res) => {
  try {
    const { email, role, about, phone } = req.body; // Added phone
    let user = await UserProfile.findOneAndUpdate(
      { email },
      { role, about, phone },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. TOGGLE SAVED HOME
router.post('/toggle-save', async (req, res) => {
  const { email, listingId } = req.body;
  try {
    let user = await UserProfile.findOne({ email });
    if (!user) user = new UserProfile({ email });

    const index = user.savedListings.indexOf(listingId);
    if (index === -1) {
      user.savedListings.push(listingId);
    } else {
      user.savedListings.splice(index, 1);
    }
    await user.save();
    res.json(user.savedListings);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;