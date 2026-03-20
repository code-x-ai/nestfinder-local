import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser, userRole, logout, loading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const [stats, setStats] = useState({ users: 0, listings: 0 });
  const [allUsers, setAllUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);

  const nameRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();

  // Memoized fetch functions to avoid unnecessary re-renders
  const fetchStats = useCallback(async () => { 
    try { 
      const res = await axios.get('http://localhost:5000/api/admin/stats'); 
      setStats(res.data); 
    } catch (err) { console.error(err); } 
  }, []);

  const fetchUsers = useCallback(async () => { 
    try { 
      const res = await axios.get('http://localhost:5000/api/admin/users'); 
      setAllUsers(res.data); 
    } catch (err) { console.error(err); } 
  }, []);

  const fetchReports = useCallback(async () => { 
    try { 
      const res = await axios.get('http://localhost:5000/api/reports'); 
      setReports(res.data); 
    } catch (err) { console.error(err); } 
  }, []);

  const fetchContactMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${currentUser.email}`);
      const contacts = res.data.filter(n => n.listingId === 'contact');
      setContactMessages(contacts);
    } catch (err) {
      console.error('Error fetching contact messages:', err);
    }
  }, [currentUser]);

  // SECURITY CHECK - Redirect if not admin
  useEffect(() => {
    if (!loading && currentUser) {
      if (userRole !== 'admin') {
        navigate('/');
      }
    } else if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, userRole, loading, navigate]);

  // Fetch all data when admin is authenticated
  useEffect(() => {
    if (currentUser && userRole === 'admin') {
      fetchStats();
      fetchUsers();
      fetchReports();
      fetchContactMessages();
    }
  }, [currentUser, userRole, fetchStats, fetchUsers, fetchReports, fetchContactMessages]);

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to delete user ${email} and ALL their listings? This cannot be undone.`)) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/user/${email}`);
        setAllUsers(allUsers.filter(u => u.email !== email));
        fetchStats();
        setReports(reports.filter(r => r.ownerEmail !== email));
        alert("User deleted.");
      } catch (err) { alert("Failed to delete user"); }
    }
  };

  const handleDeleteListing = async (id, userEmail) => {
    if (window.confirm("Admin Action: Delete this listing?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/listing/${id}`);
        const updatedUsers = allUsers.map(user => {
          if (user.email === userEmail) {
            return { ...user, listings: user.listings.filter(l => l._id !== id) };
          }
          return user;
        });
        setAllUsers(updatedUsers);
        fetchStats();
      } catch (err) { alert("Failed to delete listing"); }
    }
  };

  // Report Actions
  const handleResolveReport = async (reportId, action, payload) => {
    try {
      if (action === 'delete_listing') {
        if (window.confirm("Delete the reported listing?")) {
          await axios.delete(`http://localhost:5000/api/admin/listing/${payload.listingId}`);
          await axios.delete(`http://localhost:5000/api/reports/${reportId}`);
          alert("Listing deleted and report resolved.");
        } else return;
      } 
      else if (action === 'delete_user') {
        if (window.confirm(`Delete owner ${payload.ownerEmail} entirely?`)) {
          await axios.delete(`http://localhost:5000/api/admin/user/${payload.ownerEmail}`);
          await axios.delete(`http://localhost:5000/api/reports/${reportId}`);
          alert("User banned and report resolved.");
        } else return;
      } 
      else if (action === 'dismiss') {
        await axios.delete(`http://localhost:5000/api/reports/${reportId}`);
      }
      
      fetchReports();
      fetchUsers();
      fetchStats();
    } catch (err) { 
      alert("Action failed."); 
      console.error(err); 
    }
  };

  // Delete a contact message
  const handleDeleteContact = async (id) => {
    if (window.confirm("Delete this contact message?")) {
      try {
        await axios.delete(`http://localhost:5000/api/notifications/${id}`);
        setContactMessages(prev => prev.filter(msg => msg._id !== id));
        alert("Contact message deleted.");
      } catch (err) {
        alert("Failed to delete message.");
        console.error(err);
      }
    }
  };

  const handleAdminUpdate = async () => {
    setLocalLoading(true);
    setError("");
    setMessage("");
    try {
      if (nameRef.current.value !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: nameRef.current.value });
        setMessage("Admin profile updated.");
      } else {
        setMessage("No changes made.");
      }
    } catch { 
      setError("Failed to update profile."); 
    }
    setLocalLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }
    if (passwordRef.current.value.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    try {
      await updatePassword(currentUser, passwordRef.current.value);
      setMessage("Password changed successfully.");
      passwordRef.current.value = "";
      passwordConfirmRef.current.value = "";
    } catch { 
      setError("Failed to change password. Log out and back in first if changing fails."); 
    }
  };

  const handleLogout = async () => { 
    try { 
      await logout(); 
      navigate('/login'); 
    } catch { 
      alert("Failed to log out"); 
    } 
  };

  const SidebarItem = ({ id, icon, label, count }) => (
    <button 
      onClick={() => id === 'logout' ? handleLogout() : setActiveTab(id)} 
      className={`w-full flex items-center gap-3 px-6 py-4 transition text-sm font-medium ${activeTab === id ? 'bg-charcoal text-white border-r-4 border-brick-primary' : 'text-gray-600 hover:bg-gray-100'} ${id === 'logout' ? 'text-red-500 hover:bg-red-50 mt-auto' : ''}`}
    >
      <i className={`${icon} w-5 text-center`}></i> {label}
      {count > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}
    </button>
  );

  // Show loading state while checking auth
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-charcoal font-bold">Verifying admin access...</div>
      </div>
    );
  }

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      <main className="p-6">
        <div className="container mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-charcoal text-white p-2 rounded-lg">
              <i className="fas fa-user-shield text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">Admin Portal</h1>
              <p className="text-sm text-warm-gray">Manage users and content.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-soft-xl overflow-hidden sticky top-6">
                <div className="p-6 text-center border-b border-gray-100 bg-charcoal text-white">
                  <div className="w-20 h-20 bg-brick-primary rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/20 text-3xl">
                    <i className="fas fa-crown"></i>
                  </div>
                  <h2 className="text-lg font-bold">{currentUser?.displayName || "Admin"}</h2>
                  <p className="text-white/60 text-xs">{currentUser?.email}</p>
                </div>
                <nav className="py-2 flex flex-col h-full">
                  <SidebarItem id="dashboard" icon="fas fa-tachometer-alt" label="Dashboard" />
                  <SidebarItem id="users" icon="fas fa-users" label="User Management" />
                  <SidebarItem id="reports" icon="fas fa-exclamation-triangle" label="Reports" count={reports.length} />
                  <SidebarItem id="contact" icon="fas fa-envelope" label="Notifications" count={contactMessages.length} />
                  <SidebarItem id="settings" icon="fas fa-cog" label="Settings" />
                  <SidebarItem id="logout" icon="fas fa-sign-out-alt" label="Log Out" />
                </nav>
              </div>
            </div>

            <div className="lg:col-span-9 space-y-6">
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">
                        <i className="fas fa-users"></i>
                      </div>
                      <div>
                        <p className="text-warm-gray text-sm font-bold uppercase">Total Users</p>
                        <h3 className="text-3xl font-bold text-charcoal">{stats.users}</h3>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="w-16 h-16 bg-orange-50 text-brick-primary rounded-2xl flex items-center justify-center text-3xl">
                        <i className="fas fa-home"></i>
                      </div>
                      <div>
                        <p className="text-warm-gray text-sm font-bold uppercase">Total Listings</p>
                        <h3 className="text-3xl font-bold text-charcoal">{stats.listings}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4">System Status</h3>
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded-lg inline-flex">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> Systems Operational
                    </div>
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-soft-xl overflow-hidden border border-gray-100 animate-fade-in-up">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-charcoal">Registered Users</h3>
                    <span className="bg-charcoal text-white text-xs px-2 py-1 rounded">{allUsers.length} Users</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-warm-gray font-bold uppercase text-xs">
                        <tr>
                          <th className="p-4">User</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Listings</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allUsers.map(user => (
                          <React.Fragment key={user._id}>
                            <tr className="hover:bg-gray-50 transition">
                              <td className="p-4">
                                <p className="font-bold text-charcoal">{user.email}</p>
                                <p className="text-xs text-gray-500">{user.phone || "No Phone"}</p>
                              </td>
                              <td className="p-4">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{user.role}</span>
                              </td>
                              <td className="p-4 font-bold">{user.listingCount}</td>
                              <td className="p-4 text-right flex justify-end gap-2">
                                <button 
                                  onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)} 
                                  className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  {expandedUser === user._id ? 'Hide' : 'View'} Listings
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.email)} 
                                  className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Delete User
                                </button>
                              </td>
                            </tr>
                            
                            {expandedUser === user._id && (
                              <tr>
                                <td colSpan="4" className="p-4 bg-gray-50 border-b border-gray-200">
                                  <div className="pl-4 border-l-2 border-brick-primary">
                                    <h4 className="font-bold text-xs uppercase text-warm-gray mb-3">Listings by {user.email}</h4>
                                    {user.listings.length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">No listings found.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user.listings.map(l => (
                                          <div key={l._id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                              <img src={l.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                                              <div>
                                                <p className="font-bold text-sm truncate w-32">{l.title}</p>
                                                <p className="text-xs text-gray-500">{l.listingType}</p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Link 
                                                to={`/listing/${l._id}`} 
                                                target="_blank" 
                                                state={{ fromAdmin: true }} 
                                                className="text-gray-400 hover:text-brick-primary"
                                              >
                                                <i className="far fa-eye"></i>
                                              </Link>
                                              <button onClick={() => handleDeleteListing(l._id, user.email)} className="text-red-400 hover:text-red-600">
                                                <i className="fas fa-trash"></i>
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORTS TAB */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-charcoal">Reported Listings</h2>
                  {reports.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-400">
                      <i className="fas fa-check-circle text-4xl mb-4 text-green-500"></i>
                      <p>No reports found. Good job!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map(report => (
                        <div key={report._id} className="bg-white p-6 rounded-2xl shadow-soft-xl border border-l-4 border-l-red-500 border-gray-100 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-charcoal">Report on: "{report.listingTitle}"</h3>
                              <p className="text-sm text-red-600 font-bold mt-1">Reason: {report.reason}</p>
                            </div>
                            <span className="text-xs text-warm-gray">{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-2">
                            <p><span className="font-bold text-charcoal">Reported By:</span> {report.reporterEmail}</p>
                            <p><span className="font-bold text-charcoal">Listing Owner:</span> {report.ownerEmail}</p>
                            <p className="text-xs text-gray-400">ID: {report.listingId}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                            <Link to={`/listing/${report.listingId}`} target="_blank" className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition">
                              <i className="far fa-eye mr-2"></i> View Listing
                            </Link>
                            <button onClick={() => handleResolveReport(report._id, 'delete_listing', { listingId: report.listingId })} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-100 transition">
                              <i className="fas fa-trash mr-2"></i> Delete Listing
                            </button>
                            <button onClick={() => handleResolveReport(report._id, 'delete_user', { ownerEmail: report.ownerEmail })} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition">
                              <i className="fas fa-user-slash mr-2"></i> Ban Owner
                            </button>
                            <button onClick={() => handleResolveReport(report._id, 'dismiss')} className="ml-auto text-gray-400 hover:text-charcoal px-4 py-2 font-bold text-sm">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CONTACT MESSAGES TAB */}
              {activeTab === 'contact' && (
                <div className="space-y-6 animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-charcoal">Notifications</h2>
                  {contactMessages.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-400">
                      <i className="fas fa-envelope-open-text text-4xl mb-4 text-gray-400"></i>
                      <p>No messages yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contactMessages.map(msg => (
                        <div key={msg._id} className="bg-white p-6 rounded-2xl shadow-soft-xl border border-l-4 border-l-blue-500 border-gray-100 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-charcoal">From: {msg.senderName}</h3>
                              <p className="text-sm text-gray-600 mt-1">Email: {msg.senderEmail}</p>
                              <p className="text-sm text-gray-600 mt-1">Phone: {msg.senderPhone}</p>
                            </div>
                            <span className="text-xs text-warm-gray">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-xl text-sm">
                            <p className="font-bold text-charcoal mb-1">Message:</p>
                            <p className="text-gray-700 whitespace-pre-line">{msg.listingTitle}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleDeleteContact(msg._id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition"
                            >
                              <i className="fas fa-trash mr-2"></i> Delete Message
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in-up">
                  {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>}
                  {message && <div className="bg-green-100 text-green-700 p-4 rounded-xl">{message}</div>}
                  
                  <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-gray-100">
                    <h3 className="text-lg font-bold text-charcoal mb-4">Admin Profile</h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-semibold text-charcoal">Display Name</label>
                        <input 
                          ref={nameRef} 
                          defaultValue={currentUser?.displayName} 
                          type="text" 
                          className="w-full mt-1 p-3 border rounded-lg outline-none focus:border-charcoal" 
                        />
                      </div>
                      <button 
                        onClick={handleAdminUpdate} 
                        disabled={localLoading} 
                        className="bg-charcoal text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-black transition"
                      >
                        Save Info
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-gray-100">
                    <h3 className="text-lg font-bold text-charcoal mb-4">Security</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-semibold text-charcoal">New Password</label>
                        <input type="password" ref={passwordRef} className="w-full mt-1 p-3 border rounded-lg outline-none focus:border-charcoal" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-charcoal">Confirm Password</label>
                        <input type="password" ref={passwordConfirmRef} className="w-full mt-1 p-3 border rounded-lg outline-none focus:border-charcoal" />
                      </div>
                      <button 
                        disabled={localLoading} 
                        className="bg-charcoal text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-black transition"
                      >
                        Update Password
                      </button>
                    </form>
                  </div>
                  
                  <div className="bg-gray-100 p-4 rounded-xl text-center text-xs text-gray-500">
                    Admin accounts cannot be deleted from this panel. Contact system support.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;