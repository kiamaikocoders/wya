import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { StatusScreen } from '@/components/status/StatusScreen';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
  }, [location.pathname]);

  return <StatusScreen variant="not_found" />;
};

export default NotFound;
