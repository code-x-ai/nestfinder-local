import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AdminRedirect } from './context/AuthContext';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddListing from './pages/AddListing';
import MyListings from './pages/MyListings';
import EditListing from './pages/EditListing';
import ListingDetails from './pages/ListingDetails';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import VerifyOtp from './pages/VerifyOtp';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import RequireVerified from './components/RequireVerified';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminRedirect> {/* Wrapper to handle admin redirect */}
          <div className="App font-sans text-charcoal bg-off-white min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/add-listing" element={<AddListing />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-listing/:id" element={<EditListing />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/profile" element={<RequireVerified><Profile /></RequireVerified>} />
              <Route path="/add-listing" element={<RequireVerified><AddListing /></RequireVerified>} />
              <Route path="/edit-listing/:id" element={<RequireVerified><EditListing /></RequireVerified>} />
              <Route path="/my-listings" element={<RequireVerified><MyListings /></RequireVerified>} />
            </Routes>
          </div>
        </AdminRedirect>
      </AuthProvider>
    </Router>
  );
}

export default App;