import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [propertyType, setPropertyType] = useState('All');

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(6);

  // Ref for scrolling to results
  const listingsRef = useRef(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        propertyType: propertyType
      };

      if (activeTab !== 'All') {
        let typeParam = 'Sell';
        if (activeTab === 'Rent') typeParam = 'Rent';
        if (activeTab === 'Flatmate') typeParam = 'Flatmate';
        if (activeTab === 'Commercial') typeParam = 'Commercial';
        if (activeTab === 'Buy') typeParam = 'Sell';
        params.listingType = typeParam;
      }

      const res = await axios.get('http://localhost:5000/api/listings', { params });
      setListings(res.data);
      setVisibleCount(6);
    } catch (err) { console.error('Error fetching data:', err); }
    setLoading(false);
  };

  const fetchUserSaved = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/user/${currentUser.email}`);
      const ids = res.data.savedListings.map(item => item._id || item); 
      setSavedIds(ids);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchListings();
    fetchUserSaved();
    // eslint-disable-next-line
  }, [activeTab, currentUser]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchListings();
    if (listingsRef.current) {
      listingsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleSave = async (id) => {
    if (!currentUser) return alert('Please log in to save homes.');
    try {
      if (savedIds.includes(id)) {
        setSavedIds(savedIds.filter(sid => sid !== id));
      } else {
        setSavedIds([...savedIds, id]);
      }
      await axios.post('http://localhost:5000/api/user/toggle-save', {
        email: currentUser.email,
        listingId: id
      });
    } catch (err) { alert('Error saving listing'); }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow mt-20">
        
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-b from-brick-accent/20 to-off-white py-20 md:py-28">
          <div className="container mx-auto px-6 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-center text-charcoal tracking-tight leading-tight">
              Find a home that suits <br/> <span className="text-brick-primary">your lifestyle.</span>
            </h1>
            
            {/* SEARCH WIDGET */}
            <div className="bg-white rounded-2xl shadow-floating w-full max-w-5xl p-2 z-10 animate-fade-in-up">
              
              {/* TABS */}
              <div className="flex flex-wrap gap-2 p-2 mb-2 justify-center md:justify-start">
                {['All', 'Buy', 'Rent', 'Flatmate', 'Commercial'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    className={`px-6 py-2 font-medium rounded-full transition-all duration-300 text-sm md:text-base ${
                      activeTab === tab ? 'bg-brick-primary text-white shadow-md' : 'text-warm-gray hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* SEARCH BOX */}
              <form onSubmit={handleSearch} className="bg-off-white p-3 rounded-xl flex flex-col md:flex-row items-center gap-3">
                <div className="flex-grow flex items-center bg-white px-4 py-3 rounded-lg border border-gray-200 focus-within:border-brick-primary w-full shadow-sm">
                  <i className="fas fa-map-marker-alt text-brick-secondary mr-3 text-lg"></i>
                  <input 
                    type="text" 
                    placeholder="Search by City, Location..." 
                    className="w-full outline-none bg-transparent" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>

                <div className="w-full md:w-48 flex items-center bg-white px-4 py-3 rounded-lg border border-gray-200 focus-within:border-brick-primary shadow-sm">
                  <i className="fas fa-home text-brick-secondary mr-2"></i>
                  <select 
                    value={propertyType} 
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full outline-none bg-transparent text-charcoal font-medium cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Shared Room">Shared Room</option>
                  </select>
                </div>

                <button type="submit" className="w-full md:w-auto bg-brick-primary hover:bg-brick-secondary text-white h-full py-3.5 px-8 rounded-lg font-bold text-lg shadow-md flex items-center justify-center gap-2">
                  Search
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* LISTINGS GRID */}
        <section ref={listingsRef} className="py-16 bg-off-white">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold text-charcoal">
                {searchTerm || propertyType !== 'All' ? 'Search Results' : `${activeTab} Listings`}
              </h2>
              <span className="text-sm font-semibold text-warm-gray bg-gray-100 px-3 py-1 rounded-full">
                Showing {Math.min(visibleCount, listings.length)} of {listings.length}
              </span>
            </div>

            {!loading && listings.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl">
                  <i className="fas fa-search"></i>
                </div>
                <h3 className="text-xl font-bold text-charcoal">No Listings Found</h3>
                <p className="text-warm-gray mt-2">Try changing your search terms or property type.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {listings.slice(0, visibleCount).map((item) => (
                <Link
                  to={`/listing/${item._id}`}
                  key={item._id}
                  className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-floating transition-all duration-300 group relative"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brick-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase">
                      {item.type}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSave(item._id);
                      }}
                      className={`absolute top-4 right-4 p-2 rounded-full transition shadow-sm ${
                        savedIds.includes(item._id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-warm-gray hover:text-red-500'
                      }`}
                    >
                      <i className={`${savedIds.includes(item._id) ? 'fas' : 'far'} fa-heart text-lg`}></i>
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-brick-primary mb-1">
                      ₹ {item.price.toLocaleString()}
                    </h3>
                    <h3 className="text-charcoal font-bold text-lg truncate">
                      {item.title}
                    </h3>
                    <p className="text-warm-gray text-sm mb-4">
                      <i className="fas fa-map-marker-alt text-brick-secondary"></i> {item.location}
                    </p>
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-warm-gray uppercase">
                        {item.bhk ? `${item.bhk} BHK` : item.listingType}
                      </span>
                      <Link
                        to={`/listing/${item._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-charcoal text-white hover:bg-brick-primary text-sm font-semibold px-5 py-2 rounded-full transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* VIEW MORE BUTTON */}
            {visibleCount < listings.length && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="bg-white border-2 border-brick-primary text-brick-primary hover:bg-brick-primary hover:text-white font-bold py-3 px-8 rounded-full transition-all shadow-sm hover:shadow-md"
                >
                  View More Listings <i className="fas fa-chevron-down ml-2"></i>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-charcoal text-white/70 py-16 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-8 mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-brick-primary rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-building text-xl"></i>
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">NestFinder</span>
            </div>
            <div className="flex gap-6">
              <button
                onClick={() => window.open('#', '_blank')}
                className="hover:text-brick-secondary transition bg-transparent border-none cursor-pointer text-white/70 hover:text-brick-secondary p-0 text-base"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </button>
              <button
                onClick={() => window.open('#', '_blank')}
                className="hover:text-brick-secondary transition bg-transparent border-none cursor-pointer text-white/70 hover:text-brick-secondary p-0 text-base"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter"></i>
              </button>
              <button
                onClick={() => window.open('#', '_blank')}
                className="hover:text-brick-secondary transition bg-transparent border-none cursor-pointer text-white/70 hover:text-brick-secondary p-0 text-base"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2026 NestFinder Realty. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="hover:text-white transition text-white/70 hover:text-white text-sm underline">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-white transition text-white/70 hover:text-white text-sm underline">
                Terms of Service
              </Link>
              {/* 👇 New Contact link */}
              <Link to="/contact" className="hover:text-white transition text-white/70 hover:text-white text-sm underline">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;