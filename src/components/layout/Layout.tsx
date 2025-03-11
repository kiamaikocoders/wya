
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen bg-kenya-dark">
      <Navbar />
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;
