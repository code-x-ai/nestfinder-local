const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  listingId: { type: String, required: true },
  listingTitle: { type: String, required: true },
  ownerEmail: { type: String, required: true }, // The bad user
  reporterEmail: { type: String, required: true }, // The good user
  reason: { type: String, default: "Suspicious Activity" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);