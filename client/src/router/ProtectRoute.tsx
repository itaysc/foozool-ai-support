/* eslint-disable @typescript-eslint/no-unused-vars */
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
  if (location.pathname !== '/login') {
    setRequestedUrl(location.pathname);
  }

  // Redirect to login if not authenticated and not loading
  if (!isLoading && !isAuthenticated) {
    console.log('🔍 ProtectedRoute: Not authenticated, redirecting to login');
    navigate('/login');
    return null;
  }

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingPage />;
  }

  // Show protected content if authenticated
  if (isAuthenticated) {
    return element;
  }

  return null;
};

export default ProtectedRoute;
