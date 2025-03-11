
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            {/* These routes would be implemented in future iterations */}
            <Route path="/forum" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-white text-2xl">Forum Page - Coming Soon</h1></div>} />
            <Route path="/tickets" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-white text-2xl">Tickets Page - Coming Soon</h1></div>} />
            <Route path="/friends" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-white text-2xl">Friends Page - Coming Soon</h1></div>} />
            <Route path="/wishlist" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-white text-2xl">Wishlist Page - Coming Soon</h1></div>} />
            <Route path="/profile" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-white text-2xl">Profile Page - Coming Soon</h1></div>} />
            <Route path="/login" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-white text-2xl">Login Page - Coming Soon</h1></div>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
