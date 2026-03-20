const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    console.log('Contact form received:', { name, email, message }); // 👈 for debugging

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Determine admin email – use ADMIN_EMAIL from env, fallback to EMAIL_USER
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
      console.error('❌ No admin email configured. Set ADMIN_EMAIL or EMAIL_USER in .env');
      return res.status(500).json({ message: 'Server configuration error: admin email missing' });
    }

    // Create a notification – store the actual message in listingTitle
    const newNotification = new Notification({
      ownerEmail: adminEmail,
      senderName: name,
      senderEmail: email,
      senderPhone: 'N/A',                // Placeholder – required field
      listingTitle: message,              // 👈 store the actual message here
      listingId: 'contact',                // 👈 special ID to identify contact messages
      isRead: false
    });

    const saved = await newNotification.save();
    console.log('✅ Saved contact notification:', saved);
    res.json({ message: 'Message sent successfully' });

  } catch (err) {
    console.error('❌ Contact error:', err);
    res.status(500).json({ message: err.message || 'Failed to send message' });
  }
});

module.exports = router;