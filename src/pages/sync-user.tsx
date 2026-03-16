/**
 * Temporary page to sync Firebase user to local database
 * Visit /sync-user after logging in to create your profile
 */

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function SyncUserPage() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get token from AuthContext or localStorage
      let authToken = token || localStorage.getItem('firebaseToken');
      
      // If no token, try to get it from the user
      if (!authToken && user) {
        console.log('🔄 No token found, getting fresh token from Firebase...');
        try {
          authToken = await user.getIdToken();
          localStorage.setItem('firebaseToken', authToken);
        } catch (tokenError) {
          console.error('❌ Failed to get token:', tokenError);
          throw new Error('Failed to get authentication token. Please try logging out and back in.');
        }
      }

      if (!authToken) {
        throw new Error('No authentication token available. Please log in again.');
      }

      console.log('📤 Syncing user with token...');
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username: username || user?.email?.split('@')[0],
          displayName: displayName || user?.email?.split('@')[0],
        }),
      });

      const data = await response.json();
      console.log('📥 Sync response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Sync failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/user/${user?.uid}`);
      }, 2000);
    } catch (err) {
      console.error('❌ Sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync user');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>✅ Success!</CardTitle>
            <CardDescription>Your profile has been created. Redirecting...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sync Your Profile</CardTitle>
          <CardDescription>
            Create your profile in the database to use all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium leading-relaxed">
              <strong className="text-blue-950 dark:text-blue-50">One-time setup:</strong> This creates your profile in the database.
              After this, you'll be able to edit your profile, manage earnings, and delete your account.
            </p>
          </div>
          <form onSubmit={handleSync} className="space-y-4">
            <div>
              <Label htmlFor="email">Email (from Firebase)</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={user.email?.split('@')[0] || 'username'}
              />
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user.email?.split('@')[0] || 'Display Name'}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Syncing...' : 'Create Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
