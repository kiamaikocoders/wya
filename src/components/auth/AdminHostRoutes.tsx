import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy } from 'react';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminEvents = lazy(() => import('@/pages/AdminEvents'));
const AdminProposals = lazy(() => import('@/pages/AdminProposals'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminModeration = lazy(() => import('@/pages/AdminModeration'));
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'));
const AdminSponsorAnalytics = lazy(() => import('@/pages/AdminSponsorAnalytics'));
const AdminMaps = lazy(() => import('@/pages/AdminMaps'));
const AdminGhost = lazy(() => import('@/pages/AdminGhost'));
const AdminMediaGallery = lazy(() => import('@/pages/AdminMediaGallery'));
const AdminFeedback = lazy(() => import('@/pages/AdminFeedback'));
const AdminMarketplace = lazy(() => import('@/pages/AdminMarketplace'));
const AdminFinance = lazy(() => import('@/pages/AdminFinance'));
const AdminCommunications = lazy(() => import('@/pages/AdminCommunications'));
const AdminSystem = lazy(() => import('@/pages/AdminSystem'));
const AdminAudit = lazy(() => import('@/pages/AdminAudit'));
const AdminNotifications = lazy(() => import('@/pages/AdminNotifications'));

/**
 * Routes for admin.wya254.com — admin console only.
 * Any non-admin path is forced to `/admin` (no consumer landing).
 */
export function AdminHostRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
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
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
