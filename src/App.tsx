
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SurveyPage from "./pages/SurveyPage";
import CreateSurveyPage from "./pages/CreateSurveyPage";
import SurveyResultsPage from "./pages/SurveyResultsPage";
import Forum from "./pages/Forum";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventId" element={<EventDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Survey routes */}
              <Route path="/surveys/:surveyId" element={
                <ProtectedRoute>
                  <SurveyPage />
                </ProtectedRoute>
              } />
              <Route path="/events/:eventId/create-survey" element={
                <ProtectedRoute>
                  <CreateSurveyPage />
                </ProtectedRoute>
              } />
              <Route path="/surveys/:surveyId/results" element={
                <ProtectedRoute>
                  <SurveyResultsPage />
                </ProtectedRoute>
              } />

              {/* Forum routes */}
              <Route path="/forum" element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              } />
              <Route path="/forum/:postId" element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              } />

              {/* User Profile */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Protected routes */}
              <Route path="/tickets" element={
                <ProtectedRoute>
                  <div className="min-h-screen flex items-center justify-center">
                    <h1 className="text-white text-2xl">Tickets Page - Coming Soon</h1>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/friends" element={
                <ProtectedRoute>
                  <div className="min-h-screen flex items-center justify-center">
                    <h1 className="text-white text-2xl">Friends Page - Coming Soon</h1>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute>
                  <div className="min-h-screen flex items-center justify-center">
                    <h1 className="text-white text-2xl">Wishlist Page - Coming Soon</h1>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
