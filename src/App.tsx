import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { MediaConsentPostingProvider } from "@/contexts/MediaConsentPostingContext";
import { LegalConsentGate } from "@/components/legal/LegalConsentGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import AppOnlyRoute from "./components/auth/AppOnlyRoute";
import { HostGate } from "./components/auth/HostGate";
import { AdminHostRoutes } from "./components/auth/AdminHostRoutes";
import { isAdminHost } from "./lib/site-origins";
import { updateService } from './lib/update-service';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Analytics } from "@vercel/analytics/react";
import { OneSignalProvider } from "@/components/onesignal/OneSignalProvider";
import { AppErrorBoundary } from "@/components/status/AppErrorBoundary";
import { OfflineGate } from "@/components/status/OfflineGate";
import { MaintenanceGate } from "@/components/status/MaintenanceGate";

const Layout = lazy(() => import("./components/layout/Layout"));
const MarketingLayout = lazy(() => import("./components/layout/MarketingLayout"));
const HomeOrAccountRedirect = lazy(() => import("./components/auth/HomeOrAccountRedirect"));

const Landing = lazy(() => import("./pages/Landing"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));

const Account = lazy(() => import("./pages/Account"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Events = lazy(() => import("./pages/Events"));
const Categories = lazy(() => import("./pages/Categories"));
const AuthWelcome = lazy(() => import("./pages/AuthWelcome"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const EmailConfirmationPending = lazy(() => import("./pages/EmailConfirmationPending"));
const ProfileBySurface = lazy(() => import("./components/auth/ProfileBySurface"));
const SettingsBySurface = lazy(() => import("./components/auth/SettingsBySurface"));

const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AdminProposals = lazy(() => import("./pages/AdminProposals"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSponsorAnalytics = lazy(() => import("./pages/AdminSponsorAnalytics"));
const AdminMaps = lazy(() => import("./pages/AdminMaps"));
const AdminGhost = lazy(() => import("./pages/AdminGhost"));
const AdminMediaGallery = lazy(() => import("./pages/AdminMediaGallery"));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const AdminMarketplace = lazy(() => import("./pages/AdminMarketplace"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const AdminCommunications = lazy(() => import("./pages/AdminCommunications"));
const AdminSystem = lazy(() => import("./pages/AdminSystem"));
const AdminAudit = lazy(() => import("./pages/AdminAudit"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const PublicEventMediaGallery = lazy(() => import("./pages/PublicEventMediaGallery"));

const RequestEvent = lazy(() => import("./pages/RequestEvent"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SurveyPage = lazy(() => import("./pages/SurveyPage"));
const CreateSurveyPage = lazy(() => import("./pages/CreateSurveyPage"));
const SurveyResultsPage = lazy(() => import("./pages/SurveyResultsPage"));
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
const MediaConsentPolicy = lazy(() => import("./pages/MediaConsentPolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ContactSupport = lazy(() => import("./pages/ContactSupport"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const UsersDirectory = lazy(() => import("./pages/UsersDirectory"));
const SponsorsPage = lazy(() => import("./pages/SponsorsPage"));
const SponsorZone = lazy(() => import("./pages/SponsorZone"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));

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
          <HostGate>
          <ThemeProvider>
            <AuthProvider>
              <OneSignalProvider>
              <MediaConsentPostingProvider>
              <AppErrorBoundary>
              <OfflineGate>
              <MaintenanceGate>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen bg-gradient-promo">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
                  </div>
                }
              >
                <LegalConsentGate />
                {isAdminHost() ? (
                  <AdminHostRoutes />
                ) : (
                <Routes>
                  <Route element={<MarketingLayout />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/download" element={<DownloadApp />} />
                  </Route>
                  {/* Local / legacy: admin still at /admin; production www redirects to admin.wya254.com */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="proposals" element={<AdminProposals />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="moderation" element={<AdminModeration />} />
                    <Route path="media-gallery" element={<AdminMediaGallery />} />
                    <Route path="feedback" element={<AdminFeedback />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="sponsor-analytics" element={<AdminSponsorAnalytics />} />
                    <Route path="maps" element={<AdminMaps />} />
                    <Route path="ghost" element={<AdminGhost />} />
                    <Route path="marketplace" element={<AdminMarketplace />} />
                    <Route path="finance" element={<AdminFinance />} />
                    <Route path="communications" element={<AdminCommunications />} />
                    <Route path="system" element={<AdminSystem />} />
                    <Route path="email" element={<Navigate to="/admin/communications" replace />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="audit" element={<AdminAudit />} />
                  </Route>

                  <Route path="/admin-login" element={<Navigate to="/admin" replace />} />

                  <Route element={<Layout />}>
                    <Route path="/events/:eventId?" element={<Events />} />
                    <Route path="/home" element={<HomeOrAccountRedirect />} />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <Account />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/share/event-media/:token"
                      element={
                        <AppOnlyRoute featureLabel="Event media galleries">
                          <PublicEventMediaGallery />
                        </AppOnlyRoute>
                      }
                    />
                    <Route
                      path="/categories/:slug"
                      element={
                        <AppOnlyRoute featureLabel="Category browsing">
                          <Categories />
                        </AppOnlyRoute>
                      }
                    />
                    <Route path="/welcome" element={<AuthWelcome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/confirm" element={<AuthCallback />} />
                    <Route path="/email-confirmation-pending" element={<EmailConfirmationPending />} />
                    <Route
                      path="/request-event"
                      element={
                        <AppOnlyRoute featureLabel="Event requests and hosting">
                          <RequestEvent />
                        </AppOnlyRoute>
                      }
                    />
                    <Route
                      path="/create-event"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Event creation">
                            <CreateEvent />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <AppOnlyRoute featureLabel="Search">
                          <Search />
                        </AppOnlyRoute>
                      }
                    />
                    <Route
                      path="/stories"
                      element={
                        <AppOnlyRoute featureLabel="Stories">
                          <Stories />
                        </AppOnlyRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ai-assistance"
                      element={
                        <AppOnlyRoute featureLabel="AI assistance">
                          <AIAssistance />
                        </AppOnlyRoute>
                      }
                    />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/media-consent" element={<MediaConsentPolicy />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/contact" element={<ContactSupport />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Favourites">
                            <Favorites />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />

                    {/* Sponsors — app-only per streamlined web proposal */}
                    <Route
                      path="/sponsors"
                      element={
                        <AppOnlyRoute featureLabel="Sponsors">
                          <SponsorsPage />
                        </AppOnlyRoute>
                      }
                    />
                    <Route
                      path="/sponsors/:sponsorId"
                      element={
                        <AppOnlyRoute featureLabel="Sponsor zones">
                          <SponsorZone />
                        </AppOnlyRoute>
                      }
                    />

                    {/* User Profiles */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfileBySurface />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsBySurface />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users/:userId"
                      element={
                        <AppOnlyRoute featureLabel="Member profiles">
                          <UserProfile />
                        </AppOnlyRoute>
                      }
                    />

                    {/* Chat */}
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Chat">
                            <ChatPage />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat/:conversationId"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Chat">
                            <ChatPage />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />

                    {/* Survey routes */}
                    <Route
                      path="/surveys/:surveyId"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Surveys">
                            <SurveyPage />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/surveys/:surveyId/results"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Survey results">
                            <SurveyResultsPage />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/surveys/create"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Survey creation">
                            <CreateSurveyPage />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />

                    {/* Forum sunset — keep redirects for old links */}
                    <Route path="/forum" element={<Navigate to="/discover" replace />} />
                    <Route path="/forum/:postId" element={<Navigate to="/discover" replace />} />

                    {/* Tickets — available on web and app */}
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
                          <AppOnlyRoute featureLabel="Analytics">
                            <AnalyticsDashboard />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics/events/:eventId"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Analytics">
                            <AnalyticsDashboard />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics/event/:eventId"
                      element={
                        <ProtectedRoute>
                          <AppOnlyRoute featureLabel="Event analytics">
                            <EventAnalytics />
                          </AppOnlyRoute>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/users"
                      element={
                        <AppOnlyRoute featureLabel="Member directory">
                          <UsersDirectory />
                        </AppOnlyRoute>
                      }
                    />

                    {/* Discover */}
                    <Route
                      path="/discover"
                      element={
                        <AppOnlyRoute featureLabel="Discover">
                          <DiscoverPage />
                        </AppOnlyRoute>
                      }
                    />
                    <Route
                      path="/discover/:id"
                      element={
                        <AppOnlyRoute featureLabel="Discover">
                          <DiscoverPage />
                        </AppOnlyRoute>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
                )}
              </Suspense>
              </MaintenanceGate>
              </OfflineGate>
              </AppErrorBoundary>
              </MediaConsentPostingProvider>
              </OneSignalProvider>
            </AuthProvider>
          </ThemeProvider>
          </HostGate>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </HelmetProvider>
    </TooltipProvider>
    <Analytics />
  </QueryClientProvider>
);
};

export default App;
