import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type EntityType = 'settings' | 'none' | string;

function useCurrentEntityTracker() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<EntityType>('none');
  useEffect(() => {
    const entity = location.pathname.split('/').filter(Boolean)[0];
    setCurrentPage(entity as EntityType);
  }, [location.pathname]);

  return currentPage;
}

export default useCurrentEntityTracker;
