import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AddListing = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 🔐 Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  // All hooks
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [videoName, setVideoName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    type: 'Apartment',
    description: '',
    listingType: 'Sell',
    bhk: '2',
    area: '',
    amenities: [],
    showMap: true
  });
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);

  const coverInputRef = useRef();
  const galleryInputRef = useRef();
  const videoInputRef = useRef();

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'showMap') {
      setFormData({ ...formData, showMap: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleListingType = (type) => setFormData({ ...formData, listingType: type });
  const handleBHK = (val) => setFormData({ ...formData, bhk: val });

  const toggleAmenity = (amenity) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + galleryFiles.length > 5) {
      alert('You can only upload up to 5 gallery images.');
      return;
    }
    setGalleryFiles([...galleryFiles, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setGalleryPreviews([...galleryPreviews, ...newPreviews]);
  };

  const removeGalleryImage = (index) => {
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoName(file.name);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoName('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coverFile) {
      alert('Please upload a Head Image (Cover). It is required.');
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('location', formData.location);
      data.append('price', formData.price);
      data.append('type', formData.type);
      data.append('description', formData.description);
      data.append('listingType', formData.listingType);
      data.append('bhk', formData.bhk);
      data.append('area', formData.area);
      data.append('ownerEmail', currentUser.email);
      data.append('showMap', formData.showMap);
      data.append('amenities', JSON.stringify(formData.amenities));

      data.append('coverImage', coverFile);
      if (videoFile) data.append('video', videoFile);

      galleryFiles.forEach((file) => {
        data.append('galleryImages', file);
      });

      await axios.post('http://localhost:5000/api/listings', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Property Listed Successfully!');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error saving listing: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const getTypeBtnClass = (currentType) => {
    const isActive = formData.listingType === currentType;
    return `flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive ? 'bg-white shadow-sm text-brick-primary' : 'text-gray-400 hover:text-gray-600'}`;
  };

  if (!currentUser) return null;

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-24">
        {/* Steps indicator */}
        <div className="flex items-center mb-10 overflow-x-auto pb-4 gap-8 justify-center">
          {[1, 2, 3].map(num => (
            <React.Fragment key={num}>
              <div className="flex items-center gap-3 min-w-fit">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= num ? 'bg-brick-primary text-white' : 'border-2 border-gray-200 text-gray-300'}`}>{num}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase opacity-60">Step {num}</span>
                  <span className="font-bold text-sm">{num === 1 ? 'Essentials' : num === 2 ? 'Media' : 'Amenities'}</span>
                </div>
              </div>
              {num < 3 && <div className="h-[1px] w-12 bg-gray-200"></div>}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in-up">
              <div><h2 className="text-3xl font-bold">The Essentials</h2><p className="text-warm-gray mt-1">Start by telling us what kind of property you're listing.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">Property Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brick-accent">
                    <option value="Apartment">Apartment / Flat</option><option value="House">Independent House</option><option value="Hostel">Hostel / PG</option><option value="Shared Room">Shared Room</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">Listing Type</label>
                  <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-2xl gap-1">
                    <button type="button" onClick={() => handleListingType('Sell')} className={getTypeBtnClass('Sell')}>For Sale</button>
                    <button type="button" onClick={() => handleListingType('Rent')} className={getTypeBtnClass('Rent')}>For Rent</button>
                    <button type="button" onClick={() => handleListingType('Flatmate')} className={getTypeBtnClass('Flatmate')}>Flatmate</button>
                    <button type="button" onClick={() => handleListingType('Commercial')} className={getTypeBtnClass('Commercial')}>Commercial</button>
                  </div>
                </div>
              </div>
              <div className="space-y-3"><label className="text-sm font-bold">Property Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Luxurious 2BHK in Mumbai" className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brick-accent" required /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><label className="text-sm font-bold">Expected Price (₹)</label><input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Enter amount" className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brick-accent" required /></div>
                <div className="space-y-3"><label className="text-sm font-bold">Location</label><input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Andheri West" className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brick-accent" required /></div>
              </div>
              <div className="flex justify-end pt-8"><button type="button" onClick={() => setStep(2)} className="px-12 py-4 bg-brick-primary text-white rounded-2xl font-bold shadow-xl shadow-brick-primary/20 hover:scale-[1.02] transition-all">Next Step <i className="fas fa-chevron-right ml-2 text-xs"></i></button></div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in-up">
              <div><h2 className="text-3xl font-bold">Media</h2><p className="text-warm-gray mt-1">Upload photos to showcase your property.</p></div>

              {/* Cover Image */}
              <div>
                <label className="text-sm font-bold block mb-2">1. Head Image (Cover) <span className="text-red-500">* Required</span></label>
                <div onClick={() => coverInputRef.current.click()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-brick-primary hover:bg-orange-50 bg-gray-50 relative overflow-hidden h-48 flex items-center justify-center ${!coverFile ? 'border-red-200' : 'border-gray-200'}`}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div><i className="fas fa-image text-3xl text-gray-300 mb-2"></i><p className="text-sm font-bold text-gray-400">Click to Upload Cover</p></div>
                  )}
                  <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="text-sm font-bold block mb-2">2. Gallery Images (Max 5) <span className="text-gray-400 font-normal">- Optional</span></label>
                <div onClick={() => galleryInputRef.current.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brick-primary hover:bg-orange-50 bg-gray-50 mb-4">
                  <i className="fas fa-images text-2xl text-gray-300 mb-1"></i><p className="text-sm font-bold text-gray-400">Add up to 5 photos</p>
                  <input type="file" ref={galleryInputRef} onChange={handleGalleryChange} className="hidden" accept="image/*" multiple />
                </div>
                <div className="flex gap-4 overflow-x-auto">
                  {galleryPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0 group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video */}
              <div>
                <label className="text-sm font-bold block mb-2">3. Property Video (Max 1) <span className="text-gray-400 font-normal">- Optional</span></label>
                <div className="flex items-center gap-4">
                  <div onClick={() => videoInputRef.current.click()} className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brick-primary hover:bg-orange-50 bg-gray-50">
                    <i className="fas fa-video text-2xl text-gray-300 mb-1"></i>
                    <p className="text-sm font-bold text-gray-400">{videoName || 'Upload a video tour'}</p>
                    <input type="file" ref={videoInputRef} onChange={handleVideoChange} className="hidden" accept="video/*" />
                  </div>
                  {videoFile && (
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition"
                    >
                      Remove Video
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-8 border-t border-gray-100 mt-12">
                <button type="button" onClick={() => setStep(1)} className="px-8 py-4 font-bold text-warm-gray hover:text-brick-primary transition">Go Back</button>
                <button type="button" onClick={() => setStep(3)} className="px-12 py-4 bg-brick-primary text-white rounded-2xl font-bold shadow-xl shadow-brick-primary/20 hover:scale-[1.02] transition-all">Next Step <i className="fas fa-chevron-right ml-2 text-xs"></i></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in-up">
              <div><h2 className="text-3xl font-bold">Details & Amenities</h2><p className="text-warm-gray mt-1">Add the final touches.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><label className="text-sm font-bold">BHK Configuration</label><div className="flex flex-wrap gap-2">{['1', '2', '3', '4+'].map((num) => (<button key={num} type="button" onClick={() => handleBHK(num)} className={`px-4 py-2 rounded-xl border text-sm font-bold transition ${formData.bhk === num ? 'bg-brick-primary text-white border-brick-primary' : 'border-gray-200 hover:border-brick-primary'}`}>{num} BHK</button>))}</div></div>
                <div className="space-y-3"><label className="text-sm font-bold">Carpet Area (sq.ft)</label><input type="number" name="area" value={formData.area} onChange={handleChange} placeholder="e.g. 1200" className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brick-accent" /></div>
              </div>
              <div className="p-5 border-2 border-gray-50 rounded-2xl flex items-center justify-between hover:border-brick-accent/50 transition">
                <div><span className="text-sm font-bold block">Show Map on Listing</span><span className="text-[10px] text-warm-gray">Allow users to see the location on a map</span></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="showMap" checked={formData.showMap} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brick-primary"></div>
                </label>
              </div>
              <div className="space-y-3"><label className="text-sm font-bold">Amenities</label><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{['Gymnasium', 'Power Backup', 'Infinity Pool', 'Reserved Parking', 'Smart Home', '24/7 Security'].map((amenity) => (<label key={amenity} className={`group flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.amenities.includes(amenity) ? 'border-brick-primary bg-orange-50' : 'border-gray-50 hover:border-brick-accent'}`}><div className="relative flex items-center"><input type="checkbox" checked={formData.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="w-5 h-5 accent-brick-primary rounded" /></div><span className={`text-sm font-bold ${formData.amenities.includes(amenity) ? 'text-brick-primary' : 'text-gray-600'}`}>{amenity}</span></label>))}</div></div>
              <div className="space-y-3">
                <label className="text-sm font-bold">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Describe the layout, lighting, and vibes..." className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brick-accent resize-none"></textarea>
              </div>
              <div className="flex justify-between pt-8 border-t border-gray-100 mt-12">
                <button type="button" onClick={() => setStep(2)} className="px-8 py-4 font-bold text-warm-gray hover:text-brick-primary transition">Go Back</button>
                <button type="submit" disabled={loading} className="px-12 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-600/20 hover:scale-[1.02] active:scale-95 transition-all">{loading ? 'Publishing...' : 'Publish Listing'}</button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default AddListing;