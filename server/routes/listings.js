const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. CONFIG STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Helper to delete a file from uploads folder
const deleteFile = (fileUrl) => {
  if (!fileUrl) return;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const relativePath = fileUrl.replace(baseUrl, '');
  const filePath = path.join(__dirname, '..', relativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  }
};

// 2. CREATE LISTING (POST)
router.post('/', 
  upload.fields([
    { name: 'coverImage', maxCount: 1 }, 
    { name: 'galleryImages', maxCount: 5 }, 
    { name: 'video', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const basePath = process.env.BASE_URL || 'http://localhost:5000';
      const files = req.files || {};

      if (!files.coverImage || files.coverImage.length === 0) {
        return res.status(400).json({ message: "Cover Image is required." });
      }
      let coverImageUrl = basePath + '/uploads/' + files.coverImage[0].filename;

      let galleryUrls = [];
      if (files.galleryImages) {
        galleryUrls = files.galleryImages.map(f => basePath + '/uploads/' + f.filename);
      }

      let videoUrl = "";
      if (files.video) {
        videoUrl = basePath + '/uploads/' + files.video[0].filename;
      }

      let parsedAmenities = [];
      if (req.body.amenities) {
        try { parsedAmenities = JSON.parse(req.body.amenities); } 
        catch (e) { parsedAmenities = []; }
      }

      const listing = new Listing({
        title: req.body.title,
        location: req.body.location,
        price: req.body.price,
        type: req.body.type,
        description: req.body.description || "",
        listingType: req.body.listingType,
        bhk: req.body.bhk,
        area: req.body.area,
        amenities: parsedAmenities,
        showMap: req.body.showMap === 'true',
        imageUrl: coverImageUrl, 
        galleryImages: galleryUrls,
        videoUrl: videoUrl,
        ownerEmail: req.body.ownerEmail
      });

      const newListing = await listing.save();
      res.status(201).json(newListing);

    } catch (err) {
      console.error("SERVER ERROR:", err);
      res.status(500).json({ message: "Server Error: " + err.message });
    }
});

// 3. GET ALL LISTINGS
router.get('/', async (req, res) => {
  try {
    const { search, listingType, propertyType } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { location: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    if (listingType && listingType !== "All") {
      query.listingType = listingType;
    }
    if (propertyType && propertyType !== "All") {
      query.type = propertyType;
    }

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. GET SINGLE LISTING
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    res.json(listing);
  } catch (err) {
    res.status(404).json({ message: "Not found" });
  }
});

// 5. GET USER LISTINGS
router.get('/user/:email', async (req, res) => {
  try {
    const listings = await Listing.find({ ownerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. DELETE LISTING
router.delete('/:id', async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. UPDATE LISTING (PUT) with support for deleting media
router.put('/:id', 
  upload.fields([
    { name: 'coverImage', maxCount: 1 }, 
    { name: 'galleryImages', maxCount: 5 }, 
    { name: 'video', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const basePath = process.env.BASE_URL || 'http://localhost:5000';
      const files = req.files || {};
      const listingId = req.params.id;

      const oldListing = await Listing.findById(listingId);
      if (!oldListing) return res.status(404).json({ message: "Listing not found" });

      if (oldListing.ownerEmail !== req.body.ownerEmail) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // --- Handle Cover Image ---
      let coverImageUrl = oldListing.imageUrl;
      if (files.coverImage && files.coverImage.length > 0) {
        if (oldListing.imageUrl) deleteFile(oldListing.imageUrl);
        coverImageUrl = basePath + '/uploads/' + files.coverImage[0].filename;
      }

      // --- Handle Gallery Images ---
      let galleryUrls = oldListing.galleryImages || [];
      
      // If the frontend sends a "galleryToKeep" array, use it to keep only those images.
      if (req.body.galleryToKeep) {
        try {
          const toKeep = JSON.parse(req.body.galleryToKeep);
          // Ensure toKeep is an array of strings (URLs)
          if (Array.isArray(toKeep)) {
            // Delete images that are in old gallery but not in toKeep
            const toDelete = galleryUrls.filter(url => !toKeep.includes(url));
            toDelete.forEach(url => deleteFile(url));
            galleryUrls = toKeep;
          } else {
            console.warn("galleryToKeep is not an array:", toKeep);
          }
        } catch (e) {
          console.error("Error parsing galleryToKeep:", e);
        }
      }

      // Add newly uploaded gallery images
      if (files.galleryImages && files.galleryImages.length > 0) {
        const newGalleryUrls = files.galleryImages.map(f => basePath + '/uploads/' + f.filename);
        galleryUrls = [...galleryUrls, ...newGalleryUrls];
      }

      // Remove any duplicates (just in case)
      galleryUrls = [...new Set(galleryUrls)];

      // --- Handle Video ---
      let videoUrl = oldListing.videoUrl;
      
      if (req.body.removeVideo === 'true') {
        if (oldListing.videoUrl) deleteFile(oldListing.videoUrl);
        videoUrl = '';
      }
      
      if (files.video && files.video.length > 0) {
        if (oldListing.videoUrl) deleteFile(oldListing.videoUrl);
        videoUrl = basePath + '/uploads/' + files.video[0].filename;
      }

      // Parse amenities
      let parsedAmenities = oldListing.amenities;
      if (req.body.amenities) {
        try { parsedAmenities = JSON.parse(req.body.amenities); } 
        catch (e) { parsedAmenities = []; }
      }

      const updatedData = {
        title: req.body.title || oldListing.title,
        location: req.body.location || oldListing.location,
        price: req.body.price || oldListing.price,
        type: req.body.type || oldListing.type,
        description: req.body.description || oldListing.description,
        listingType: req.body.listingType || oldListing.listingType,
        bhk: req.body.bhk || oldListing.bhk,
        area: req.body.area || oldListing.area,
        showMap: req.body.showMap === 'true', 
        amenities: parsedAmenities,
        imageUrl: coverImageUrl,
        galleryImages: galleryUrls,
        videoUrl: videoUrl
      };

      const updatedListing = await Listing.findByIdAndUpdate(listingId, updatedData, { new: true });
      res.json(updatedListing);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Update Failed: " + err.message });
    }
});

module.exports = router;