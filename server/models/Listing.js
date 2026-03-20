const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true },
  
  // Validation Rules
  description: { type: String }, 
  imageUrl: { type: String, required: true }, 
  
  // Optional Media
  galleryImages: [{ type: String }],
  videoUrl: { type: String },
  
  // Details
  listingType: { type: String, default: 'Sell' },
  bhk: { type: String },
  area: { type: String },
  amenities: [{ type: String }],
  
  // --- NEW FIELD: SHOW MAP ---
  showMap: { type: Boolean, default: true }, 

  ownerEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', ListingSchema);