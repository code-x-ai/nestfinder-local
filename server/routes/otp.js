const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Otp = require('../models/Otp');
const PendingUser = require('../models/PendingUser');
const UserProfile = require('../models/UserProfile');
const admin = require('firebase-admin');

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Send OTP (called from signup)
router.post('/send', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    // Check if user already exists in Firebase
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({ message: 'User already exists' });
    } catch (err) {
      // User not found, proceed
    }

    // Store plain password temporarily (valid for 10 minutes)
    await PendingUser.findOneAndDelete({ email }); // remove any old pending
    const pending = new PendingUser({ email, password }); // store plain, not hashed
    await pending.save();

    // Generate and send OTP
    const otp = generateOtp();
    await Otp.findOneAndDelete({ email });
    const newOtp = new Otp({ email, otp });
    await newOtp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'NestFinder - Verify Your Email Address',
      text: `Hello,

Thank you for joining NestFinder! To complete your registration and start exploring properties, please verify your email address using the following One-Time Password (OTP):

${otp}

This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.

Best regards,
The NestFinder Team`
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// 2. Verify OTP and create Firebase account
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP required' });
  }

  try {
    // Check OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Get pending user
    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ message: 'No pending registration found. Please sign up again.' });
    }

    // Create Firebase user using the stored plain password
    const userRecord = await admin.auth().createUser({
      email: email,
      password: pending.password // now plain text (temporary storage)
    });

    // Create UserProfile
    const newProfile = new UserProfile({
      email: email,
      role: 'Buyer',
      isEmailVerified: true
    });
    await newProfile.save();

    // Clean up
    await Otp.deleteOne({ _id: otpRecord._id });
    await PendingUser.deleteOne({ _id: pending._id });

    res.json({ message: 'Email verified and account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;