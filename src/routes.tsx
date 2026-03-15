import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import HomePage from './pages/index';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components for code splitting (except HomePage for instant loading)
const isDevelopment = import.meta.env.MODE === 'development';
const NotFoundPage = isDevelopment ? lazy(() => import('../dev-tools/src/PageNotFound')) : lazy(() => import('./pages/_404'));

// Lazy load stream pages
const UserProfilePage = lazy(() => import('./pages/user/[userId]'));
const StreamViewerPage = lazy(() => import('./pages/stream/[streamId]'));
const GoLivePage = lazy(() => import('./pages/go-live'));
const BroadcasterPage = lazy(() => import('./pages/broadcast/[streamId]'));
const SyncUserPage = lazy(() => import('./pages/sync-user'));
const EarningsPage = lazy(() => import('./pages/earnings'));
const BuyCoinsPage = lazy(() => import('./pages/buy-coins'));
const HelpPage = lazy(() => import('./pages/help'));
const ProfileEditPage = lazy(() => import('./pages/profile-edit'));
const AccountSettingsPage = lazy(() => import('./pages/account-settings'));
const DownloadExportPage = lazy(() => import('./pages/download-export'));
const FeedPage = lazy(() => import('./pages/feed'));
const PostDetailPage = lazy(() => import('./pages/post/[postId]'));
const AdminDashboardPage = lazy(() => import('./pages/admin'));

// Legal & Info pages
const CommunityGuidelinesPage = lazy(() => import('./pages/community-guidelines'));
const TermsOfServicePage = lazy(() => import('./pages/terms-of-service'));
const PrivacyPolicyPage = lazy(() => import('./pages/privacy-policy'));
const AboutPage = lazy(() => import('./pages/about'));
const InstallPage = lazy(() => import('./pages/install'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <FeedPage />,
  },
  {
    path: '/streams',
    element: <HomePage />,
  },
  {
    path: '/post/:postId',
    element: <PostDetailPage />,
  },
  {
    path: '/user/:userId',
    element: <UserProfilePage />,
  },
  {
    path: '/stream/:streamId',
    element: <StreamViewerPage />,
  },
  {
    path: '/go-live',
    element: <GoLivePage />,
  },
  {
    path: '/broadcast/:streamId',
    element: <BroadcasterPage />,
  },
  {
    path: '/sync-user',
    element: <SyncUserPage />,
  },
  {
    path: '/earnings',
    element: <EarningsPage />,
  },
  {
    path: '/buy-coins',
    element: <BuyCoinsPage />,
  },
  {
    path: '/help',
    element: <HelpPage />,
  },
  {
    path: '/profile/edit',
    element: (
      <ProtectedRoute>
        <ProfileEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/account/settings',
    element: (
      <ProtectedRoute>
        <AccountSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/download-export',
    element: <DownloadExportPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/community-guidelines',
    element: <CommunityGuidelinesPage />,
  },
  {
    path: '/terms-of-service',
    element: <TermsOfServicePage />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/install',
    element: <InstallPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/user/:userId' | '/stream/:streamId' | '/go-live' | '/broadcast/:streamId';

export type Params = Record<string, string | undefined>;
