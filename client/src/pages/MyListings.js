import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MyListings = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [messages, setMessages] = useState([]); // Store messages
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  const fetchData = async () => {
    try {
      // 1. Get My Listings
      const resListings = await axios.get(`http://localhost:5000/api/listings/user/${currentUser.email}`);
      setListings(resListings.data);

      // 2. Get My Messages (Inbox)
      const resMessages = await axios.get(`http://localhost:5000/api/messages/${currentUser.email}`);
      setMessages(resMessages.data);

    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this listing?")) {
      await axios.delete(`http://localhost:5000/api/listings/${id}`);
      setListings(listings.filter(item => item._id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-24 px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: MY LISTINGS */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-charcoal">My Dashboard</h1>
            <Link to="/add-listing" className="bg-brick-primary text-white px-4 py-2 rounded shadow hover:bg-brick-secondary font-bold text-sm">
              + Post New
            </Link>
          </div>

          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">My Properties</h2>
          
          <div className="space-y-6">
            {listings.length === 0 && <p className="text-gray-500">No properties posted.</p>}
            
            {listings.map((item) => (
              <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <img src={item.imageUrl || "https://via.placeholder.com/100"} alt="" className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="font-bold text-charcoal">{item.title}</h3>
                  <p className="text-sm text-gray-500">₹{item.price}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/edit-listing/${item._id}`} className="text-blue-600 text-sm font-bold border px-2 py-1 rounded">Edit</Link>
                  <button onClick={() => handleDelete(item._id)} className="text-red-600 text-sm font-bold border px-2 py-1 rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: INBOX */}
        <div>
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 mt-20 md:mt-0">Inbox ({messages.length})</h2>
          
          <div className="space-y-4 h-[500px] overflow-y-auto pr-2">
            {messages.length === 0 && <p className="text-gray-500">No messages yet.</p>}

            {messages.map((msg) => (
              <div key={msg._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-brick-secondary/10 text-brick-primary text-xs font-bold px-2 py-1 rounded">
                    Re: {msg.listingTitle}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mb-2">{msg.text}</p>
                <div className="text-xs text-gray-500 font-medium">
                  From: <a href={`mailto:${msg.senderEmail}`} className="text-blue-600 hover:underline">{msg.senderEmail}</a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyListings;