require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const app = express();

// Load Firebase service account
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use environment variable (for production or with .env)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('✅ Using Firebase service account from environment variable.');
  } else {
    // Fallback to local file (for development only)
    const filePath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(filePath)) {
      serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log('✅ Using Firebase service account from local file.');
    } else {
      throw new Error('No Firebase service account found. Please set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json file.');
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1); // Exit if Firebase Admin cannot be initialized
}

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- AUTO-CREATE UPLOADS FOLDER ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 Created 'uploads' folder successfully.");
}

// --- SERVE IMAGES ---
app.use('/uploads', express.static(uploadDir));

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://localhost:27017/nestfinder')
  .then(() => console.log("✅ Database Connected Locally"))
  .catch((err) => console.log("❌ Database Error:", err));

// --- REGISTER ROUTES ---
const listingsRoute = require('./routes/listings');
const userRoute = require('./routes/user');
const uploadRoute = require('./routes/upload');
const notificationsRoute = require('./routes/notifications');
const adminRoute = require('./routes/admin');
const reportsRoute = require('./routes/reports');
const otpRoute = require('./routes/otp');
const contactRoute = require('./routes/contact');
app.use('/api/contact', contactRoute);
app.use('/api/otp', otpRoute);

app.use('/api/listings', listingsRoute);
app.use('/api/user', userRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/admin', adminRoute);
app.use('/api/reports', reportsRoute);

// --- START SERVER ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});