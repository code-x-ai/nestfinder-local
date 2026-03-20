import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, setIsEmailVerified } = useAuth();
  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) navigate('/signup');
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Verify OTP
      await axios.post('http://localhost:5000/api/otp/verify', { email, otp });

      // 2. Retrieve temporary password
      const tempPassword = sessionStorage.getItem('tempPassword');

      if (tempPassword) {
        // 3. Automatically log in
        await login(email, tempPassword);
        // 4. Update email verification status in context (if available)
        if (setIsEmailVerified) setIsEmailVerified(true);
        // 5. Clear temporary password
        sessionStorage.removeItem('tempPassword');
        // 6. Redirect to home
        navigate('/');
      } else {
        // Fallback: password not found – redirect to login
        setMessage('Account created! Please log in.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/otp/resend', { email });
      setTimer(60);
      setCanResend(false);
      setMessage('OTP resent successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-charcoal mb-2 text-center">Verify Your Email</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          We've sent a 6-digit OTP to <span className="font-bold">{email}</span>.
          Enter it below to verify your account.
        </p>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${
            message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-charcoal ml-1">Enter OTP</label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-center text-2xl tracking-widest font-bold focus:border-brick-primary focus:ring-4 focus:ring-brick-primary/10 transition-all"
              placeholder="000000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-brick-primary hover:bg-brick-secondary text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-brick-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-brick-primary hover:text-brick-secondary font-semibold"
            >
              Resend OTP
            </button>
          ) : (
            <p>Resend OTP in <span className="font-bold">{timer}s</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;