import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // 🔐 Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  // All hooks – called unconditionally
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userProfileData, setUserProfileData] = useState({ role: 'Buyer', about: '', phone: '' });

  // Notification selection & deletion state
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [deletingNotifications, setDeletingNotifications] = useState(false);

  const nameRef = useRef();
  const fileInputRef = useRef();
  const aboutRef = useRef();
  const roleRef = useRef();
  const phoneRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();

  // Fetch data only if currentUser exists
  useEffect(() => {
    if (currentUser) {
      fetchMyListings();
      fetchUserProfile();
      fetchNotifications();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  const fetchMyListings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/listings/user/${currentUser.email}`);
      setMyListings(res.data);
    } catch (err) { console.error("Error fetching listings:", err); }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/user/${currentUser.email}`);
      setUserProfileData({ 
          role: res.data.role, 
          about: res.data.about, 
          phone: res.data.phone || "" 
      });
      setSavedListings(res.data.savedListings || []);
    } catch (err) { console.error("Error fetching profile:", err); }
  };

  const fetchNotifications = async () => {
      try {
          const res = await axios.get(`http://localhost:5000/api/notifications/${currentUser.email}`);
          setNotifications(res.data);
          setSelectedNotifications([]); // Clear selection on fetch
      } catch (err) { console.error(err); }
  };

  // Notification selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNotifications(notifications.map(n => n._id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;

    const confirmDelete = window.confirm(`Delete ${selectedNotifications.length} notification(s)?`);
    if (!confirmDelete) return;

    setDeletingNotifications(true);
    let successCount = 0;
    let failCount = 0;
    const failedIds = [];

    for (const id of selectedNotifications) {
      try {
        await axios.delete(`http://localhost:5000/api/notifications/${id}`);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete notification ${id}:`, err);
        failCount++;
        failedIds.push(id);
      }
    }

    // Remove successfully deleted notifications from state
    if (successCount > 0) {
      const successfullyDeleted = selectedNotifications.filter(id => !failedIds.includes(id));
      setNotifications(prev => prev.filter(n => !successfullyDeleted.includes(n._id)));
      setSelectedNotifications([]);
    }

    setDeletingNotifications(false);

    if (failCount === 0) {
      alert("Notifications deleted successfully.");
    } else {
      alert(`Deleted ${successCount} notification(s), but failed to delete ${failCount}. Check console for details.`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await updateProfile(currentUser, { photoURL: res.data.url });
      window.location.reload(); 
    } catch (err) { alert("Failed to upload image"); }
    setLoading(false);
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      if (nameRef.current.value !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: nameRef.current.value });
      }
      await axios.post('http://localhost:5000/api/user/update', {
        email: currentUser.email,
        role: roleRef.current.value,
        about: aboutRef.current.value,
        phone: phoneRef.current.value
      });
      setUserProfileData({ 
          role: roleRef.current.value, 
          about: aboutRef.current.value,
          phone: phoneRef.current.value
      });
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) { alert("Failed to update profile"); }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordRef.current.value !== passwordConfirmRef.current.value) return setError("Passwords do not match");
    try {
        setError(""); setMessage(""); setLoading(true);
        await updatePassword(currentUser, passwordRef.current.value);
        setMessage("Password changed successfully!");
        passwordRef.current.value = ""; passwordConfirmRef.current.value = "";
    } catch (err) { setError("Failed to change password. Try logging out and back in."); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
      if (window.confirm("WARNING: This will permanently delete your account. Are you sure?")) {
          try { setLoading(true); await deleteUser(currentUser); navigate('/login', { replace: true }); } 
          catch (err) { setError("Failed to delete. Re-login required."); }
          setLoading(false);
      }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm("Delete this listing?")) {
      await axios.delete(`http://localhost:5000/api/listings/${id}`);
      setMyListings(myListings.filter(item => item._id !== id));
    }
  };

  const handleUnsave = async (listingId) => {
    try {
      await axios.post('http://localhost:5000/api/user/toggle-save', {
        email: currentUser.email,
        listingId: listingId
      });
      setSavedListings(savedListings.filter(item => item._id !== listingId));
    } catch (err) {
      alert("Error removing saved listing");
      console.error(err);
    }
  };

  const handleLogout = async () => { 
    try { 
      await logout(); 
      navigate('/login', { replace: true }); 
    } catch { 
      alert("Failed to log out"); 
    } 
  };

  const SidebarItem = ({ id, icon, label, count, isRed }) => (
    <button onClick={() => id === 'logout' ? handleLogout() : setActiveTab(id)} className={`w-full flex items-center gap-3 px-6 py-4 transition text-sm font-medium ${activeTab === id ? 'bg-orange-50 text-brick-primary border-r-4 border-brick-primary' : 'text-charcoal hover:bg-gray-50 hover:text-brick-primary'} ${isRed ? 'text-red-500 hover:bg-red-50 hover:text-red-600 border-t border-gray-100 mt-2' : ''}`}>
        <i className={`${icon} w-5 text-center`}></i> {label}
        {count !== undefined && <span className="ml-auto bg-gray-100 text-charcoal text-xs px-2 py-0.5 rounded-full font-bold">{count}</span>}
    </button>
  );

  // If not authenticated, don't render the profile (redirect will happen)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      <Navbar />
      <main className="pt-24 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* SIDEBAR */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-soft-xl overflow-hidden sticky top-24">
                <div className="p-6 text-center border-b border-gray-100 bg-gradient-to-b from-brick-accent/10 to-white">
                  <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <img src={currentUser?.photoURL || "https://images.unsplash.com/photo-1511367461989-f85a21fda167"} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm" />
                    <div className="absolute bottom-0 right-0 bg-brick-primary text-white p-2 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-brick-secondary transition"><i className="fas fa-camera text-xs"></i></div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>
                  <h2 className="text-xl font-bold text-charcoal">{currentUser?.displayName || "User"}</h2>
                  <p className="text-warm-gray text-sm mb-3">{userProfileData.role}</p>
                </div>
                <nav className="py-2">
                  <SidebarItem id="profile" icon="fas fa-user" label="My Profile" />
                  <SidebarItem id="listings" icon="fas fa-home" label="My Listings" count={myListings.length} />
                  <SidebarItem id="notifications" icon="fas fa-bell" label="Notifications" count={notifications.length} />
                  <SidebarItem id="saved" icon="far fa-heart" label="Saved Listings" count={savedListings.length} />
                  <SidebarItem id="settings" icon="fas fa-cog" label="Settings" />
                  <SidebarItem id="logout" icon="fas fa-sign-out-alt" label="Log Out" isRed={true} />
                </nav>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-9 space-y-6">
              {activeTab === 'profile' && (
                <>
                  <div className="bg-white rounded-2xl p-8 shadow-soft-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div><h1 className="text-2xl font-bold text-charcoal mb-1">Personal Information</h1></div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="btn-outline border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-semibold hover:border-brick-primary hover:text-brick-primary transition"><i className="fas fa-edit mr-2"></i> Edit Profile</button>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleProfileUpdate} disabled={loading} className="bg-brick-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:bg-brick-secondary transition">Save Changes</button>
                      </div>
                    )}
                  </div>
                  {message && <div className="bg-green-100 text-green-700 p-4 rounded-xl border border-green-200">{message}</div>}
                  <div className="bg-white rounded-2xl p-8 shadow-soft-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-charcoal">Display Name</label><input ref={nameRef} defaultValue={currentUser?.displayName} disabled={!isEditing} type="text" className={`w-full pl-4 pr-4 py-3 rounded-lg border outline-none font-medium transition ${isEditing ? 'border-gray-300 focus:border-brick-primary bg-white' : 'border-transparent bg-gray-50'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-charcoal">Email</label><input defaultValue={currentUser?.email} disabled type="email" className="w-full pl-4 pr-4 py-3 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" /></div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-charcoal">Phone Number</label>
                      <div className="relative">
                        <i className="fas fa-phone absolute left-4 top-3.5 text-warm-gray"></i>
                        <input ref={phoneRef} defaultValue={userProfileData.phone} disabled={!isEditing} placeholder="+91 0000000000" type="tel" className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none font-medium transition ${isEditing ? 'border-gray-300 focus:border-brick-primary bg-white' : 'border-transparent bg-gray-50'}`} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-charcoal">Role</label>
                      <div className="relative">
                        <select ref={roleRef} disabled={!isEditing} value={userProfileData.role} onChange={(e) => setUserProfileData({...userProfileData, role: e.target.value})} className={`w-full pl-4 pr-4 py-3 rounded-lg border outline-none font-medium appearance-none transition ${isEditing ? 'border-gray-300 focus:border-brick-primary bg-white' : 'border-transparent bg-gray-50'}`}>
                          <option value="Buyer">Property Buyer</option><option value="Seller">Property Seller</option><option value="Agent">Real Estate Agent</option><option value="Flatmate Finder">Flatmate Finder</option><option value="Builder">Builder</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-charcoal">About Me</label><textarea ref={aboutRef} disabled={!isEditing} defaultValue={userProfileData.about} className={`w-full p-4 rounded-lg border outline-none font-medium h-32 resize-none transition ${isEditing ? 'border-gray-300 focus:border-brick-primary bg-white' : 'border-transparent bg-gray-50'}`}></textarea></div>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-charcoal">Notifications</h2>
                    {selectedNotifications.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        disabled={deletingNotifications}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingNotifications ? (
                          <>Deleting...</>
                        ) : (
                          <>
                            <i className="fas fa-trash"></i> Delete Selected ({selectedNotifications.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 && (
                    <p className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-500">
                      No new notifications.
                    </p>
                  )}

                  {notifications.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-soft-xl overflow-hidden">
                      {/* Select All header */}
                      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-charcoal cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 accent-brick-primary rounded"
                          />
                          Select All
                        </label>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif._id} className="p-6 hover:bg-gray-50 transition relative">
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={selectedNotifications.includes(notif._id)}
                                onChange={() => handleSelectOne(notif._id)}
                                className="w-4 h-4 accent-brick-primary rounded mt-1"
                                disabled={deletingNotifications}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="bg-brick-accent/20 text-brick-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    New Inquiry
                                  </span>
                                  <span className="text-xs text-warm-gray">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="font-bold text-lg text-charcoal mb-1">
                                  Interested in: {notif.listingTitle}
                                </h4>
                                <div className="mt-4 p-4 bg-off-white rounded-xl border border-gray-200">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-500 text-xs">Name</p>
                                      <p className="font-bold">{notif.senderName}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Phone</p>
                                      <p className="font-bold text-brick-primary">{notif.senderPhone}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Email</p>
                                      <p className="font-bold">{notif.senderEmail}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <a
                                    href={`tel:${notif.senderPhone}`}
                                    className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition"
                                  >
                                    <i className="fas fa-phone mr-2"></i> Call Now
                                  </a>
                                  <a
                                    href={`mailto:${notif.senderEmail}`}
                                    className="flex-1 bg-gray-100 text-charcoal text-center py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition"
                                  >
                                    <i className="fas fa-envelope mr-2"></i> Email
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-charcoal">Account Settings</h2>
                  {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>}
                  {message && <div className="bg-green-100 text-green-700 p-4 rounded-xl border border-green-200">{message}</div>}
                  <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-gray-100">
                    <h3 className="text-lg font-bold text-charcoal mb-4">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div><label className="text-sm font-semibold text-charcoal">New Password</label><input type="password" ref={passwordRef} required className="w-full mt-1 p-3 border rounded-lg focus:border-brick-primary outline-none" /></div>
                      <div><label className="text-sm font-semibold text-charcoal">Confirm Password</label><input type="password" ref={passwordConfirmRef} required className="w-full mt-1 p-3 border rounded-lg focus:border-brick-primary outline-none" /></div>
                      <button disabled={loading} className="bg-brick-primary text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-brick-secondary transition">Update Password</button>
                    </form>
                  </div>
                  <div className="bg-red-50 rounded-2xl shadow-sm p-8 border border-red-100">
                    <h3 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                    <p className="text-red-600 text-sm mb-6">Once deleted, data cannot be recovered.</p>
                    <button onClick={handleDeleteAccount} disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-red-700 transition">Delete My Account</button>
                  </div>
                </div>
              )}

              {(activeTab === 'listings' || activeTab === 'saved') && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-charcoal">
                      {activeTab === 'listings' ? 'My Active Listings' : 'Saved Listings'}
                    </h2>
                    {activeTab === 'listings' && (
                      <Link to="/add-listing" className="bg-brick-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-brick-secondary">
                        + Post New
                      </Link>
                    )}
                  </div>
                  {(activeTab === 'listings' ? myListings : savedListings).length === 0 && (
                    <p className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-500">
                      Nothing to show.
                    </p>
                  )}
                  {(activeTab === 'listings' ? myListings : savedListings).map((item) => (
                    <div key={item._id} className="bg-white rounded-2xl shadow-soft-xl overflow-hidden p-6 border border-gray-100 flex flex-col md:flex-row gap-6">
                      <img src={item.imageUrl} alt="" className="w-full md:w-48 h-48 md:h-32 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-charcoal">{item.title}</h4>
                        <p className="text-warm-gray text-sm mb-2">{item.location}</p>
                        <h3 className="text-xl font-bold text-brick-primary">₹ {item.price.toLocaleString()}</h3>
                      </div>
                      <div className="flex gap-2 self-start">
                        <Link to={`/listing/${item._id}`} className="px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">
                          <i className="far fa-eye"></i>
                        </Link>
                        {activeTab === 'listings' && (
                          <>
                            <Link to={`/edit-listing/${item._id}`} className="px-3 py-1 border rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button onClick={() => handleDeleteListing(item._id)} className="px-3 py-1 border rounded bg-red-50 text-red-500 hover:bg-red-100">
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        )}
                        {activeTab === 'saved' && (
                          <button
                            onClick={() => handleUnsave(item._id)}
                            className="px-3 py-1 border rounded bg-red-50 text-red-500 hover:bg-red-100"
                            title="Remove from saved"
                          >
                            <i className="fas fa-heart-broken"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;