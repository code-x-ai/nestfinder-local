const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'file-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// UPLOAD ROUTE
router.post('/', upload.single('file'), (req, res) => {
  try {
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(400).json({ message: "Upload failed" });
  }
});

module.exports = router;