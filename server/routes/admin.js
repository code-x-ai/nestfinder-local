const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Listing = require('../models/Listing');
const admin = require('firebase-admin'); // Add Firebase Admin

// 1. GET DASHBOARD STATS
router.get('/stats', async (req, res) => {
  try {
    const userCount = await UserProfile.countDocuments({ role: { $ne: 'admin' } }); // Don't count admins
    const listingCount = await Listing.countDocuments();
    res.json({ users: userCount, listings: listingCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET ALL USERS (With their listings count)
router.get('/users', async (req, res) => {
  try {
    const users = await UserProfile.find({ role: { $ne: 'admin' } }); // Exclude admin
    
    // Attach listing count to each user
    const usersWithListings = await Promise.all(users.map(async (user) => {
        const listings = await Listing.find({ ownerEmail: user.email });
        return {
            ...user._doc,
            listingCount: listings.length,
            listings: listings // Send actual listings too for viewing
        };
    }));

    res.json(usersWithListings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE USER (And their listings + Firebase Auth)
router.delete('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // 1. Delete from Firebase Authentication
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            await admin.auth().deleteUser(userRecord.uid);
            console.log(`Deleted Firebase user: ${email}`);
        } catch (firebaseError) {
            // If user not found in Firebase, continue (maybe already deleted)
            if (firebaseError.code !== 'auth/user-not-found') {
                console.error("Firebase deletion error:", firebaseError);
                // Optionally, you can still proceed with MongoDB deletion or return an error.
                // For now, we'll just log and continue to delete MongoDB data.
            } else {
                console.log(`Firebase user not found for email: ${email}, continuing with MongoDB deletion.`);
            }
        }

        // 2. Delete User Profile from MongoDB
        await UserProfile.findOneAndDelete({ email });
        
        // 3. Delete User's Listings
        await Listing.deleteMany({ ownerEmail: email });

        res.json({ message: "User and all associated data deleted successfully from both MongoDB and Firebase" });
    } catch (err) {
        console.error("Error in delete user route:", err);
        res.status(500).json({ message: err.message });
    }
});

// 4. DELETE SPECIFIC LISTING (Admin Override)
router.delete('/listing/:id', async (req, res) => {
    try {
        await Listing.findByIdAndDelete(req.params.id);
        res.json({ message: "Listing deleted by Admin" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;