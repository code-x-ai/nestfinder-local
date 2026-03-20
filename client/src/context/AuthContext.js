import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Admin Redirect Wrapper Component
export function AdminRedirect({ children }) {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If loaded, user is logged in, is admin, and is on home page
    if (!loading && currentUser && userRole === 'admin' && location.pathname === '/') {
      navigate('/admin');
    }
  }, [loading, currentUser, userRole, location.pathname, navigate]);

  return children;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false); // 👈 new state for email verification
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserRole(null);
    setIsEmailVerified(false); // reset on logout
    return signOut(auth);
  }

  // Listen for User Changes + Fetch Role + Email Verification Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user profile from backend (includes role, phone, savedListings, isEmailVerified)
          const res = await axios.get(`http://localhost:5000/api/user/${user.email}`);
          setUserRole(res.data.role);
          setIsEmailVerified(res.data.isEmailVerified || false); // set verification status
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUserRole(null);
          setIsEmailVerified(false);
        }
      } else {
        setUserRole(null);
        setIsEmailVerified(false);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    isEmailVerified, // 👈 expose it
    setUserRole,     // Allow manual update if needed
    setIsEmailVerified, // optional, if needed elsewhere
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}