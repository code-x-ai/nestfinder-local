import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireVerified = ({ children }) => {
  const { currentUser, isEmailVerified, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-otp" replace />;
  }

  return children;
};

export default RequireVerified;