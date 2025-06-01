/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoadingPage } from '@/components/loadingPage';
import { useMainLayoutContext } from '@/context/mainLayout.context';
import store from '@/stores/auth.store';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const location = useLocation();
  const { isAuthorized: refreshTokenSucceeded, setRequestedUrl } = useMainLayoutContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!refreshTokenSucceeded) {
      navigate('/login');
    }
  }, [refreshTokenSucceeded, navigate, setRequestedUrl]);

  useEffect(() => {
    if (location.pathname !== '/login') {
      setRequestedUrl(location.pathname);
    }
  }, [location.pathname, setRequestedUrl]);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      try {
        setIsLoading(true);
        const { isAuthorized } = await store.checkAuthorization();
        if (!isAuthorized) {
          navigate('/login');
        }
        if (isMounted) {
          setIsAuthenticated(isAuthorized);
          setHasPermissions(isAuthorized);
        }
      } catch (err) {
        if (isMounted) navigate('/login');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [navigate, setIsLoading]);

  if (isLoading) return <LoadingPage />;
  if (isAuthenticated && hasPermissions) return element;
  return null;
};

export default ProtectedRoute;
