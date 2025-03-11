
import React, { useEffect } from 'react';
import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white mb-6">404</h1>
        <p className="text-xl text-kenya-brown-light mb-6">
          Oops! We couldn't find that page
        </p>
        <p className="text-kenya-brown-light mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-kenya-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
