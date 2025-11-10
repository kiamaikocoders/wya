import { Outlet } from "react-router-dom";
import MarketingNavbar from "../marketing/MarketingNavbar";
import Footer from "./Footer";

const MarketingLayout = () => {
  return (
    <div className="min-h-screen bg-kenya-dark text-white">
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;


