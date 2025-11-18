import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthed, isDeactivated } = useAuth();

  // If user is deactivated, redirect to login with deactivated parameter
  if (isDeactivated) {
    return <Navigate to="/login?deactivated=true" replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and active
  return children;
}
