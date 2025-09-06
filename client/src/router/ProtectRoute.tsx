/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoadingPage } from '@/components/loadingPage';
import { useMainLayoutContext } from '@/context/mainLayout.context';
import { useAuth } from '@/context/auth.context';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredPermissions?: string[]; // all required
  anyPermissions?: string[]; // at least one
  requiredRoles?: string[]; // at least one role name
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredPermissions, anyPermissions, requiredRoles }) => {
  const location = useLocation();
  const { setRequestedUrl } = useMainLayoutContext();
  const { isAuthenticated, isLoading, user } = useAuth();
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
    // Check role/permission gates if provided
    const userPermissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : [];
    const userRoles: string[] = Array.isArray((user as any)?.roleNames) ? (user as any).roleNames : [];

    const hasAllRequired = (requiredPermissions || []).every(p => userPermissions.includes(p));
    const hasAny = (anyPermissions || []).length === 0 || (anyPermissions || []).some(p => userPermissions.includes(p));
    const hasRole = (requiredRoles || []).length === 0 || (requiredRoles || []).some(r => userRoles.includes(r));

    if ((requiredPermissions && requiredPermissions.length > 0 && !hasAllRequired) || !hasAny || !hasRole) {
      return <LoadingPage />; // or a 403 component if you have one
    }
    return element;
  }

  // Return null while redirecting
  return null;
};

export default ProtectedRoute;
