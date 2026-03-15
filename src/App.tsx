import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import AiroErrorBoundary from '../dev-tools/src/AiroErrorBoundary';
import RootLayout from './layouts/RootLayout';
import { routes } from './routes';
import Spinner from './components/Spinner';
import { AuthProvider } from './lib/auth-context';
import { I18nProvider } from './lib/i18n/i18n-context';
import { usePWA } from './lib/usePWA';
import { usePageTracking } from './lib/usePageTracking';
import { useSessionTracking } from './lib/useSessionTracking';
import { useVisitTracking } from './lib/useVisitTracking';
import { useReferralTracking } from './lib/useReferralTracking';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const SpinnerFallback = () => (
  <div className="flex justify-center py-8 h-screen items-center">
    <Spinner />
  </div>
);

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  usePageTracking();
  useSessionTracking(); // Track real-time sessions
  useVisitTracking(); // Track page visits
  useReferralTracking(); // Track referral codes from URL
  return <>{children}</>;
}

// Create router with layout wrapper
const router = createBrowserRouter([
  {
    path: '/',
    element: import.meta.env.MODE === 'development' ? (
      <AiroErrorBoundary>
        <I18nProvider>
          <AuthProvider>
            <AnalyticsWrapper>
              <Suspense fallback={<SpinnerFallback />}>
                <RootLayout>
                  <Outlet />
                </RootLayout>
              </Suspense>
            </AnalyticsWrapper>
          </AuthProvider>
        </I18nProvider>
      </AiroErrorBoundary>
    ) : (
      <I18nProvider>
        <AuthProvider>
          <AnalyticsWrapper>
            <Suspense fallback={<SpinnerFallback />}>
              <RootLayout>
                <Outlet />
              </RootLayout>
            </Suspense>
          </AnalyticsWrapper>
        </AuthProvider>
      </I18nProvider>
    ),
    children: routes,
  },
]);

export default function App() {
  // Register PWA service worker
  usePWA();

  return (
    <>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </>
  );
}
