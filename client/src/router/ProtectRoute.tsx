/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoadingPage } from '@/components/loadingPage';
import { useMainLayoutContext } from '@/context/mainLayout.context';
import { useAuth } from '@/context/auth.context';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const location = useLocation();
  const { setRequestedUrl } = useMainLayoutContext();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Store the requested URL for redirect after login
  useEffect(() => {
    if (location.pathname !== '/login') {
      setRequestedUrl(location.pathname);
    }
  }, [location.pathname, setRequestedUrl]);

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingPage />;
  }

  // Show protected content if authenticated
  if (isAuthenticated) {
    return element;
  }

  // Return null while redirecting
  return null;
};

export default ProtectedRoute;
