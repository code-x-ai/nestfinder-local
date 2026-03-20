import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, currentUser, userRole, isEmailVerified, loading } = useAuth();
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in (after loading is done)
  useEffect(() => {
    if (!loading && currentUser) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (isEmailVerified) {
        navigate('/');
      } else {
        navigate('/verify-otp', { state: { email: currentUser.email } });
      }
    }
  }, [loading, currentUser, userRole, isEmailVerified, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setIsLoggingIn(true);

      // 1. Firebase Login
      await login(emailRef.current.value, passwordRef.current.value);

      // 2. Fetch user profile (includes role and isEmailVerified)
      const res = await axios.get(`http://localhost:5000/api/user/${emailRef.current.value}`);
      const userData = res.data;

      // 3. Redirect based on role and verification status
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.isEmailVerified) {
        navigate('/');
      } else {
        navigate('/verify-otp', { state: { email: userData.email } });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Check your email or password.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (loading) return null; // or a spinner

  return (
    <div className="font-sans text-charcoal bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* LEFT SIDE: BRANDING */}
        <div className="hidden md:flex md:w-5/12 bg-charcoal relative flex-col justify-between p-10 text-white">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Building" 
              className="w-full h-full object-cover opacity-80" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-building text-brick-secondary text-3xl"></i>
              <span className="font-bold text-2xl tracking-tight text-white drop-shadow-md">NestFinder</span>
            </div>
          </div>

          <div className="relative z-10 mb-8">
            <h2 className="text-3xl font-bold leading-tight mb-4 drop-shadow-lg">Welcome back<br/>to your community.</h2>
            <p className="text-white/90 text-base drop-shadow-md">Log in to manage your listings and find your next home.</p>
          </div>

          <div className="relative z-10 text-[10px] text-white/60">
            &copy; 2026 NestFinder Realty
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="w-full md:w-7/12 bg-white p-8 md:p-12 flex flex-col justify-center relative">
          
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <i className="fas fa-building text-brick-primary text-3xl"></i>
            <span className="font-bold text-2xl tracking-tight text-brick-primary">NestFinder</span>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-charcoal mb-2">Log In</h2>
              <p className="text-warm-gray text-sm">Enter your details to access your account.</p>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal ml-1">Email</label>
                <input 
                  type="email" 
                  ref={emailRef}
                  placeholder="name@company.com" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm font-medium focus:border-brick-primary focus:ring-4 focus:ring-brick-primary/10 transition-all" 
                  required 
                />
              </div>

              {/* Password field with show/hide toggle */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    ref={passwordRef}
                    placeholder="Your password" 
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 outline-none text-sm font-medium focus:border-brick-primary focus:ring-4 focus:ring-brick-primary/10 transition-all" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brick-primary transition"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button disabled={isLoggingIn} className="w-full bg-brick-primary hover:bg-brick-secondary text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-brick-primary/20 mt-4 transition-all transform active:scale-95">
                {isLoggingIn ? 'Logging In...' : 'Log In'}
              </button>

              <p className="text-center text-warm-gray text-sm mt-6">
                Don't have an account? 
                <Link to="/signup" className="font-bold text-brick-primary hover:text-brick-secondary ml-1">Sign Up</Link>
              </p>

              {/* Browse Properties as Guest */}
              <div className="text-center mt-4">
                <Link to="/" className="text-sm text-gray-500 hover:text-brick-primary transition">
                  ← Browse Properties as Guest
                </Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;