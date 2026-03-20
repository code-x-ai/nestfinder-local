const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  ownerEmail: { type: String, required: true }, // Who receives it
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  senderPhone: { type: String, required: true },
  listingTitle: { type: String, required: true },
  listingId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', NotificationSchema);