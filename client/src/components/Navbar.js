import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is admin, don't render navbar at all
  if (userRole === 'admin') {
    return null;
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert('Failed to log out');
    }
  }

  return (
    <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm font-sans transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* LOGO */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform hover:scale-105"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-brick-primary/10 to-brick-accent/20 rounded-lg flex items-center justify-center group-hover:from-brick-primary group-hover:to-brick-secondary transition-all duration-300">
              <i className="fas fa-building text-brick-primary text-lg md:text-xl group-hover:text-white transition-colors"></i>
            </div>
            <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-brick-primary to-brick-secondary bg-clip-text text-transparent">
              NestFinder
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6">
            {currentUser ? (
              <>
                {/* Profile link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-full hover:bg-gray-100/80 transition border border-transparent hover:border-gray-200"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-brick-primary/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brick-primary to-brick-secondary flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-charcoal">
                    {currentUser.displayName || 'Profile'}
                  </span>
                </Link>

                {/* Post Property button */}
                <Link
                  to="/add-listing"
                  className="bg-gradient-to-r from-brick-primary to-brick-secondary hover:from-brick-secondary hover:to-brick-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <i className="fas fa-plus"></i>
                  <span>Post Property</span>
                </Link>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition shadow-sm"
                  title="Log Out"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-warm-gray hover:text-brick-primary transition px-4 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-brick-primary to-brick-secondary hover:from-brick-secondary hover:to-brick-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden text-warm-gray text-xl p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden absolute w-full bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-xl transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex flex-col gap-3 text-sm font-medium">
          {currentUser ? (
            <>
              <Link
                to="/add-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 rounded-xl hover:bg-gray-100 transition flex items-center gap-3"
              >
                <i className="fas fa-plus text-brick-primary w-5"></i>
                Post Property
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 rounded-xl hover:bg-gray-100 transition flex items-center gap-3"
              >
                <i className="fas fa-user text-brick-primary w-5"></i>
                My Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="py-3 px-4 rounded-xl hover:bg-red-50 text-red-500 font-bold transition flex items-center gap-3 text-left"
              >
                <i className="fas fa-sign-out-alt w-5"></i>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 rounded-xl hover:bg-gray-100 transition flex items-center gap-3"
              >
                <i className="fas fa-sign-in-alt text-brick-primary w-5"></i>
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-brick-primary to-brick-secondary text-white font-bold transition flex items-center gap-3"
              >
                <i className="fas fa-user-plus w-5"></i>
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;