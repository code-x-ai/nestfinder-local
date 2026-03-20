const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } ,// plain password (temporary)
  createdAt: { type: Date, default: Date.now, expires: 600 } // auto-delete after 10 minutes
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);