import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Removed useLocation
import Navbar from '../components/Navbar';
import PropertyMap from '../components/PropertyMap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ListingDetails = () => {
  const { id } = useParams();
  const { currentUser, userRole } = useAuth(); // Added userRole
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if current user is admin
  const isAdmin = userRole === 'admin';

  // Modals
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/listings/${id}`);
        setListing(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  const allImages = listing ? [listing.imageUrl, ...(listing.galleryImages || [])].filter(Boolean) : [];
  const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(price);

  const openLightbox = useCallback((index) => {
    setPhotoIndex(index);
    setLightboxOpen(true);
  }, []);

  const nextImage = useCallback((e) => {
    e?.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback((e) => {
    e?.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  const handleContactOwner = async () => {
    if (!currentUser) {
      alert("Please log in to contact the owner.");
      navigate('/login');
      return;
    }

    try {
      const userRes = await axios.get(`http://localhost:5000/api/user/${currentUser.email}`);
      const userProfile = userRes.data;

      if (!userProfile.phone || userProfile.phone.trim() === "") {
        setShowIncompleteModal(true);
      } else {
        await axios.post('http://localhost:5000/api/notifications', {
          ownerEmail: listing.ownerEmail,
          senderName: currentUser.displayName || "NestFinder User",
          senderEmail: currentUser.email,
          senderPhone: userProfile.phone,
          listingTitle: listing.title,
          listingId: listing._id
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      alert("Error connecting to server.");
      console.error(err);
    }
  };

  const openReportModal = () => {
    if (!currentUser) {
      alert("Please log in to report a listing.");
      navigate('/login');
      return;
    }
    setShowReportModal(true);
    setReportReason('');
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      alert("Please enter a reason for reporting.");
      return;
    }

    setSubmittingReport(true);
    try {
      await axios.post('http://localhost:5000/api/reports', {
        listingId: listing._id,
        listingTitle: listing.title,
        ownerEmail: listing.ownerEmail,
        reporterEmail: currentUser.email,
        reason: reportReason
      });
      setShowReportModal(false);
      alert("Thank you for your report. Our team will review it shortly.");
    } catch (err) {
      console.error("Report error:", err);
      const msg = err.response?.data?.message || "Failed to submit report. Please try again.";
      alert(msg);
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-brick-primary font-bold">Loading...</div>;
  if (!listing) return <div className="flex items-center justify-center h-screen">Listing not found.</div>;

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      {/* Navbar – will be hidden for admin because Navbar component returns null */}
      <Navbar />

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl">
            <i className="fas fa-times"></i>
          </button>
          <button onClick={prevImage} className="absolute left-4 text-white/70 hover:text-white text-3xl">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="relative max-w-7xl max-h-screen p-4">
            <img src={allImages[photoIndex]} alt="Full View" className="max-h-[85vh] max-w-full object-contain shadow-2xl" />
            <div className="absolute bottom-[-40px] left-0 right-0 text-center text-white/60">Image {photoIndex + 1} of {allImages.length}</div>
          </div>
          <button onClick={nextImage} className="absolute right-4 text-white/70 hover:text-white text-3xl">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* INCOMPLETE PROFILE MODAL */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up relative z-[10000]">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-bold text-charcoal mb-2">Profile Incomplete</h3>
            <p className="text-gray-500 mb-6 text-sm">To contact the owner, please add your <b>Phone Number</b> to your profile so they can reach you.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowIncompleteModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">Cancel</button>
              <button onClick={() => navigate('/profile')} className="flex-1 py-3 bg-brick-primary text-white rounded-xl font-bold hover:bg-brick-secondary transition">Go to Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up relative z-[10000]">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-xl font-bold text-charcoal mb-2">Request Sent!</h3>
            <p className="text-gray-500 mb-6 text-sm">We have sent your details to the owner. They will contact you within <b>24 hours</b> via Email or WhatsApp.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-brick-primary text-white rounded-xl font-bold hover:bg-brick-secondary transition">Okay, Got it</button>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up relative z-[10000]">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-flag"></i>
            </div>
            <h3 className="text-xl font-bold text-charcoal mb-2 text-center">Report Listing</h3>
            <p className="text-gray-500 mb-4 text-sm text-center">Please tell us why you are reporting this property.</p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter your reason here..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brick-primary/50 mb-4"
              rows="4"
              disabled={submittingReport}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={submittingReport}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={submittingReport}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-24">
        {/* Back Button – hidden for admin */}
        {!isAdmin && (
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-warm-gray hover:text-brick-primary transition font-medium"
            >
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 animate-fade-in-up">
          <div>
            <span className="bg-brick-accent/30 text-brick-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-brick-primary/10">
              {listing.listingType === 'Rent' ? 'For Rent' : 'For Sale'}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mt-3">{listing.title}</h1>
            <p className="text-warm-gray mt-2 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-brick-secondary"></i> {listing.location}
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <button
              onClick={openReportModal}
              className="px-4 py-2 bg-gray-100 text-red-600 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-50 transition"
            >
              Report Property
            </button>
            <div>
              <p className="text-sm text-warm-gray font-semibold text-right">Listing Price</p>
              <p className="text-4xl font-bold text-brick-primary">{formatPrice(listing.price)}</p>
            </div>
          </div>
        </div>

        {/* GALLERY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 h-[300px] md:h-[500px] rounded-3xl overflow-hidden shadow-soft-xl">
          <div className={`h-full ${allImages.length > 1 ? 'md:col-span-2' : 'md:col-span-4'} relative group cursor-pointer`} onClick={() => openLightbox(0)}>
            <img src={allImages[0]} alt="Main" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          {allImages.length > 1 && (
            <div className="hidden md:grid grid-rows-2 gap-4 md:col-span-1">
              <img src={allImages[1]} alt="Gallery 1" onClick={() => openLightbox(1)} className="w-full h-full object-cover rounded-xl cursor-pointer" />
              {allImages[2] && <img src={allImages[2]} onClick={() => openLightbox(2)} alt="Gallery 2" className="w-full h-full object-cover rounded-xl cursor-pointer" />}
            </div>
          )}
          {allImages.length > 3 && (
            <div className="hidden md:block md:col-span-1 relative cursor-pointer group" onClick={() => openLightbox(3)}>
              <img src={allImages[3]} alt="Gallery 3" className="w-full h-full object-cover rounded-xl" />
              <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center group-hover:bg-black/50 transition backdrop-blur-[2px]">
                <span className="text-white font-bold text-lg group-hover:scale-110 transition">+{allImages.length - 3} Photos</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT CONTENT */}
          <div className="lg:w-2/3 space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col items-center border-r border-gray-100 last:border-0">
                <span className="text-warm-gray text-xs font-bold uppercase mb-1">Type</span>
                <span className="text-lg font-bold text-charcoal">{listing.type}</span>
              </div>
              <div className="flex flex-col items-center border-r border-gray-100 last:border-0">
                <span className="text-warm-gray text-xs font-bold uppercase mb-1">BHK</span>
                <span className="text-lg font-bold text-charcoal">{listing.bhk} BHK</span>
              </div>
              <div className="flex flex-col items-center border-r border-gray-100 last:border-0">
                <span className="text-warm-gray text-xs font-bold uppercase mb-1">Area</span>
                <span className="text-lg font-bold text-charcoal">{listing.area} sqft</span>
              </div>
              <div className="flex flex-col items-center last:border-0">
                <span className="text-warm-gray text-xs font-bold uppercase mb-1">Status</span>
                <span className="text-lg font-bold text-green-600">Active</span>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-4">About this Property</h3>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{listing.description}</p>
            </div>

            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-6">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.amenities.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-brick-secondary hover:bg-orange-50 transition cursor-default">
                      <div className="w-10 h-10 bg-brick-accent/30 rounded-lg flex items-center justify-center text-brick-primary">
                        <i className="fas fa-check"></i>
                      </div>
                      <span className="font-semibold text-charcoal">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listing.videoUrl && (
              <div>
                <h3 className="text-2xl font-bold mb-4">Video Tour</h3>
                <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
                  <video controls className="w-full h-full object-cover">
                    <source src={listing.videoUrl} type="video/mp4" />
                  </video>
                </div>
              </div>
            )}

            {listing.showMap !== false && (
              <div className="relative z-0">
                <h3 className="text-2xl font-bold mb-4">Location Map</h3>
                <PropertyMap locationName={listing.location} />
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR – hidden for admin */}
          {!isAdmin && (
            <div className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-[2rem] shadow-soft-xl border border-gray-100 overflow-hidden p-8 text-center relative z-10">
                  <div className="w-20 h-20 bg-brick-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-user-tie text-3xl text-brick-primary"></i>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal mb-1">Interested in this property?</h3>
                  <p className="text-warm-gray text-sm mb-6">Contact the owner directly to schedule a visit or negotiate the price.</p>
                  <button
                    onClick={handleContactOwner}
                    className="w-full py-4 bg-brick-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-brick-secondary hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-envelope"></i> Contact Owner
                  </button>
                  <p className="text-xs text-gray-400 mt-4">By clicking, you agree to share your contact details with the owner.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <i className="fas fa-shield-alt text-blue-500 mt-1"></i>
                  <div>
                    <p className="text-xs font-bold text-blue-800">Safety Tip</p>
                    <p className="text-[10px] text-blue-600 mt-1">Never transfer money before viewing the property. Report suspicious listings.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListingDetails;