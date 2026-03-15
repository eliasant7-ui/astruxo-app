/**
 * Protected Route Component
 * Redirects to home if user is not authenticated
 */

import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthDialog from './AuthDialog';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access this page.
          </p>
          <button
            onClick={() => setShowAuthDialog(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Login or Register
          </button>
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </>
    );
  }

  return <>{children}</>;
}
