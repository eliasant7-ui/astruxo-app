/**
 * Account Settings Page
 * Manage account settings including deletion
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Trash2, Loader2, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function AccountSettingsPage() {
  const { user, loading: authLoading, token: authToken, refreshToken } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFirebase, setDeleteFirebase] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user is synced to database
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }

    checkUserSync();
  }, [user, authLoading, navigate]);

  const checkUserSync = async () => {
    try {
      // Get token from AuthContext or localStorage
      let token = authToken || localStorage.getItem('firebaseToken');
      
      // If no token, try to refresh
      if (!token && user) {
        console.log('🔄 No token found, attempting to refresh...');
        token = await refreshToken();
      }
      
      if (!token) {
        console.log('❌ No token available');
        setChecking(false);
        setIsSynced(false);
        return;
      }

      console.log('🔍 Checking if user is synced...');
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('📥 Sync check response:', data);

      if (data.success && data.user) {
        console.log('✅ User is synced to database');
        setIsSynced(true);
      } else if (response.status === 401) {
        // Token expired, try to refresh and retry
        console.log('🔄 Token expired, refreshing...');
        const newToken = await refreshToken();
        if (newToken) {
          const retryResponse = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          const retryData = await retryResponse.json();
          if (retryData.success && retryData.user) {
            console.log('✅ User is synced to database (after refresh)');
            setIsSynced(true);
          } else {
            console.log('❌ User not synced to database');
            setIsSynced(false);
          }
        } else {
          console.log('❌ Failed to refresh token');
          setIsSynced(false);
        }
      } else {
        console.log('❌ User not synced to database');
        setIsSynced(false);
      }
    } catch (error) {
      console.error('❌ Error checking sync:', error);
      setIsSynced(false);
    } finally {
      setChecking(false);
    }
  };

  const handleDeleteAccount = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    
    try {
      const token = localStorage.getItem('firebaseToken');
      
      if (!token) {
        toast.error('No authentication token found');
        setDeleting(false);
        return;
      }
      
      console.log('🗑️ Starting account deletion process...');
      
      // Get user ID from /api/auth/me
      const meResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const meData = await meResponse.json();
      console.log('👤 User data:', meData);
      
      if (!meData.success || !meData.user) {
        toast.error('Failed to get user information');
        setDeleting(false);
        return;
      }

      const userId = meData.user.id;
      console.log('🆔 Deleting user ID:', userId);

      // Delete account
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deleteFirebaseAccount: deleteFirebase,
        }),
      });

      const data = await response.json();
      console.log('📤 Delete response:', data);

      if (data.success) {
        toast.success('Account deleted successfully');
        setDialogOpen(false);
        
        // Logout and redirect
        await signOut(auth);
        localStorage.removeItem('firebaseToken');
        
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        toast.error(data.message || 'Failed to delete account');
        setDeleting(false);
      }
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {authLoading ? 'Checking authentication...' : 'Checking account status...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <>
      <title>Account Settings - LiveStream Platform</title>
      <meta name="description" content="Manage your account settings" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account preferences and data
            </p>
          </div>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Database Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Your account must be synced to use all features
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSynced ? (
                    <span className="text-sm text-green-600 font-medium">✓ Synced</span>
                  ) : (
                    <span className="text-sm text-yellow-600 font-medium">⚠ Not Synced</span>
                  )}
                </div>
              </div>
              
              {!isSynced && (
                <div className="space-y-2">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Your Firebase account exists, but you need to create a database profile to use features like Edit Profile, Earnings, and Delete Account.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/sync-user')} 
                    variant="default" 
                    className="w-full"
                  >
                    Go to Sync Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone - Only show if synced */}
          {isSynced && (
            <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">This will delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Your profile and user information</li>
                    <li>All your streams and stream history</li>
                    <li>All your chat messages</li>
                    <li>Your follow relationships</li>
                    <li>All gift and coin transactions</li>
                    <li>Your earnings and wallet balance</li>
                  </ul>
                </div>
              </div>

              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="deleteFirebase"
                          checked={deleteFirebase}
                          onCheckedChange={(checked) => setDeleteFirebase(checked as boolean)}
                        />
                        <Label
                          htmlFor="deleteFirebase"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Also delete my Firebase authentication account
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmText" className="text-sm font-medium">
                          Type <span className="font-bold text-destructive">DELETE</span> to confirm
                        </Label>
                        <input
                          id="confirmText"
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Type DELETE"
                          disabled={deleting}
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      onClick={() => {
                        setConfirmText('');
                        setDeleteFirebase(false);
                      }}
                      disabled={deleting}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleting || confirmText !== 'DELETE'}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </>
  );
}
