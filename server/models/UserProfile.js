const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "Buyer" },
  about: { type: String, default: "" },
  phone: { type: String, default: "" },
  savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  isEmailVerified: { type: Boolean, default: false } // 👈 new field (make sure there's a comma after the previous field)
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);