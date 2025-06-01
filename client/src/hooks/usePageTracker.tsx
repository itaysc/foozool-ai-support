import { entityType } from '@common/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function useCurrentEntityTracker() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<entityType>('none');
  useEffect(() => {
    const entity = location.pathname.split('/').filter(Boolean)[0];
    setCurrentPage(entity as entityType);
  }, [location.pathname]);

  return currentPage;
}

export default useCurrentEntityTracker;
