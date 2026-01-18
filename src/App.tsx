import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { updateService } from './lib/update-service';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const Layout = lazy(() => import("./components/layout/Layout"));
const MarketingLayout = lazy(() => import("./components/layout/MarketingLayout"));

const Landing = lazy(() => import("./pages/Landing"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));

const Home = lazy(() => import("./pages/Home"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Categories = lazy(() => import("./pages/Categories"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const EmailConfirmationPending = lazy(() => import("./pages/EmailConfirmationPending"));

const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AdminProposals = lazy(() => import("./pages/AdminProposals"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSponsorAnalytics = lazy(() => import("./pages/AdminSponsorAnalytics"));
const AdminGhost = lazy(() => import("./pages/AdminGhost"));

const RequestEvent = lazy(() => import("./pages/RequestEvent"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SurveyPage = lazy(() => import("./pages/SurveyPage"));
const CreateSurveyPage = lazy(() => import("./pages/CreateSurveyPage"));
const SurveyResultsPage = lazy(() => import("./pages/SurveyResultsPage"));
const Forum = lazy(() => import("./pages/Forum"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Search = lazy(() => import("./pages/Search"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const EventAnalytics = lazy(() => import("./pages/EventAnalytics"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const Stories = lazy(() => import("./pages/Stories"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AIAssistance = lazy(() => import("./pages/AIAssistance"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const UsersDirectory = lazy(() => import("./pages/UsersDirectory"));
const SponsorsPage = lazy(() => import("./pages/SponsorsPage"));
const SponsorZone = lazy(() => import("./pages/SponsorZone"));
const SpotlightPage = lazy(() => import("./pages/SpotlightPage"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Initialize update checking for native apps
  // Wrap in try-catch to prevent crashes
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Delay initialization to ensure app is fully loaded
        setTimeout(() => {
          try {
            updateService.initialize();
          } catch (error) {
            console.error('Failed to initialize update service:', error);
            // Don't crash - continue without updates
          }
        }, 3000); // Wait 3 seconds before initializing
      } catch (error) {
        console.error('Error setting up update service:', error);
        // Don't crash - continue without updates
      }
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen bg-gradient-promo">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
                  </div>
                }
              >
                <Routes>
                  <Route element={<MarketingLayout />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/download" element={<DownloadApp />} />
                  </Route>
                  {/* Admin routes - separate layout */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly={true}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="proposals" element={<AdminProposals />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="moderation" element={<AdminModeration />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="sponsor-analytics" element={<AdminSponsorAnalytics />} />
                    <Route path="ghost" element={<AdminGhost />} />
                  </Route>

                  <Route element={<Layout />}>
                    <Route path="/home" element={<Home />} />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:eventId" element={<EventDetails />} />
                    <Route path="/categories/:slug" element={<Categories />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/confirm" element={<AuthCallback />} />
                    <Route path="/email-confirmation-pending" element={<EmailConfirmationPending />} />
                    <Route path="/request-event" element={<RequestEvent />} />
                    <Route
                      path="/create-event"
                      element={
                        <ProtectedRoute>
                          <CreateEvent />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/search" element={<Search />} />
                    <Route path="/stories" element={<Stories />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/ai-assistance" element={<AIAssistance />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />

                    {/* Sponsor routes */}
                    <Route path="/sponsors" element={<SponsorsPage />} />
                    <Route path="/sponsors/:sponsorId" element={<SponsorZone />} />

                    {/* User Profiles */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/users/:userId" element={<UserProfile />} />

                    {/* Chat */}
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <ChatPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat/:conversationId"
                      element={
                        <ProtectedRoute>
                          <ChatPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Survey routes */}
                    <Route
                      path="/surveys/:surveyId"
                      element={
                        <ProtectedRoute>
                          <SurveyPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/surveys/:surveyId/results"
                      element={
                        <ProtectedRoute>
                          <SurveyResultsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/surveys/create"
                      element={
                        <ProtectedRoute>
                          <CreateSurveyPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Forum routes */}
                    <Route
                      path="/forum"
                      element={
                        <ProtectedRoute>
                          <Forum />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forum/:postId"
                      element={
                        <ProtectedRoute>
                          <PostDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Tickets */}
                    <Route
                      path="/tickets"
                      element={
                        <ProtectedRoute>
                          <MyTickets />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tickets/:ticketId"
                      element={
                        <ProtectedRoute>
                          <TicketDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Analytics */}
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <AnalyticsDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics/events/:eventId"
                      element={
                        <ProtectedRoute>
                          <AnalyticsDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics/event/:eventId"
                      element={
                        <ProtectedRoute>
                          <EventAnalytics />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/users" element={<UsersDirectory />} />

                    {/* Spotlight */}
                    <Route path="/spotlight" element={<SpotlightPage />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
