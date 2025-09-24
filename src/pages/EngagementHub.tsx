import React from 'react';
import { Helmet } from 'react-helmet-async';
import EngagementDashboard from '@/components/engagement/EngagementDashboard';
import { useAuth } from '@/hooks/use-auth';

const EngagementHub: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access the Engagement Hub.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Engagement Hub - WYA</title>
        <meta name="description" content="Keep the community buzzing with engaging content, throwbacks, and local tips." />
      </Helmet>
      
      <div className="min-h-screen bg-kenya-dark">
        <div className="container mx-auto px-4 py-8">
          <EngagementDashboard />
        </div>
      </div>
    </>
  );
};

export default EngagementHub;

