import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const { currentUser, loading } = useAuth(); // 👈 get loading state
  const navigate = useNavigate();

  // 🔐 Redirect to login if not authenticated (after loading is done)
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [loading, currentUser, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when currentUser is available
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    // Only allow editing the message and name (email is read-only)
    if (e.target.name === 'email') return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post('http://localhost:5000/api/contact', formData);
      setSuccess(true);
      // Keep name and email, clear only message
      setFormData(prev => ({ ...prev, message: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Show nothing while checking auth
  if (loading) return null;
  // If not authenticated after loading, redirect (handled in useEffect) – but prevent render
  if (!currentUser) return null;

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-24">
        <div className="bg-white rounded-2xl shadow-soft-xl p-8 md:p-12 border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-4 text-center">Contact Us</h1>
          <p className="text-warm-gray text-center mb-10"></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left side – Contact info */}
            <div>
              <p className="text-gray-600 mb-6">Have any questions? Reach out to us and we'll be happy to assist you.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <i className="fas fa-map-marker-alt text-brick-primary w-5"></i>
                  <span className="text-gray-600">Mumbai, India</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-brick-primary w-5"></i>
                  <span className="text-gray-600">support@nestfinder.com</span>
                </div>
              </div>

              {/* Social icons as buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => window.open('#', '_blank')}
                  className="text-gray-400 hover:text-brick-primary transition bg-transparent border-none cursor-pointer p-0 text-base"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button
                  onClick={() => window.open('#', '_blank')}
                  className="text-gray-400 hover:text-brick-primary transition bg-transparent border-none cursor-pointer p-0 text-base"
                  aria-label="Twitter"
                >
                  <i className="fab fa-twitter"></i>
                </button>
                <button
                  onClick={() => window.open('#', '_blank')}
                  className="text-gray-400 hover:text-brick-primary transition bg-transparent border-none cursor-pointer p-0 text-base"
                  aria-label="LinkedIn"
                >
                  <i className="fab fa-linkedin-in"></i>
                </button>
                <button
                  onClick={() => window.open('#', '_blank')}
                  className="text-gray-400 hover:text-brick-primary transition bg-transparent border-none cursor-pointer p-0 text-base"
                  aria-label="Email"
                >
                  <i className="fas fa-envelope"></i>
                </button>
              </div>
            </div>

            {/* Right side – Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-charcoal">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-brick-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full mt-1 p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal">Your Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-brick-primary outline-none resize-none"
                  ></textarea>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">Message sent successfully!</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brick-primary hover:bg-brick-secondary text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;