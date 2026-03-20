const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// 1. CREATE REPORT (Used by Listing Page)
router.post('/', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET ALL REPORTS (Used by Admin)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE REPORT (Dismiss)
router.delete('/:id', async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Report dismissed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;