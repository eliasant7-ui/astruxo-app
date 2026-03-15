/**
 * Profile Edit Page
 * Allow users to edit their profile information
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, Loader2, User, Mail, AtSign, FileText, Image } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export default function ProfileEditPage() {
  const { user, loading: authLoading, token: authToken, refreshToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // If not authenticated after loading, redirect
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      // Try to get token from AuthContext first, fallback to localStorage
      let token = authToken || localStorage.getItem('firebaseToken');
      
      // If no token, try to refresh
      if (!token && user) {
        console.log('🔄 No token found, attempting to refresh...');
        token = await refreshToken();
      }
      
      if (!token) {
        setError('Please login to edit your profile');
        setLoading(false);
        return;
      }

      console.log('📤 Fetching profile with token...');
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('📥 Profile response:', data);

      if (data.success && data.user) {
        setProfile(data.user);
        setDisplayName(data.user.displayName || '');
        setBio(data.user.bio || '');
        setAvatarUrl(data.user.avatarUrl || '');
        setError(null);
      } else if (response.status === 404 || data.message?.includes('not found')) {
        // User not found in database - needs to sync
        setError('Your account needs to be synced. Please visit the sync page.');
      } else if (response.status === 401 || data.message?.includes('not authenticated')) {
        // Token expired or invalid - try to refresh once
        console.log('🔄 Token expired, attempting to refresh...');
        const newToken = await refreshToken();
        if (newToken) {
          // Retry with new token
          console.log('🔄 Retrying with refreshed token...');
          const retryResponse = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          const retryData = await retryResponse.json();
          if (retryData.success && retryData.user) {
            setProfile(retryData.user);
            setDisplayName(retryData.user.displayName || '');
            setBio(retryData.user.bio || '');
            setAvatarUrl(retryData.user.avatarUrl || '');
            setError(null);
          } else {
            setError('Your session has expired. Please login again.');
          }
        } else {
          setError('Your session has expired. Please login again.');
        }
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Try to get token from AuthContext first, fallback to localStorage
      let token = authToken || localStorage.getItem('firebaseToken');
      
      // If no token, try to refresh
      if (!token && user) {
        token = await refreshToken();
      }
      
      if (!token) {
        setError('Please login to save changes');
        setSaving(false);
        return;
      }

      let finalAvatarUrl = avatarUrl;

      // If user selected a new avatar file, upload it first
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        
        // Upload to /private/avatars/ (persistent storage)
        const uploadResponse = await fetch('/api/upload/avatar', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalAvatarUrl = uploadData.url;
        } else {
          toast.error('Failed to upload avatar');
          setSaving(false);
          return;
        }
      }

      const response = await fetch(`/api/users/${profile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          avatarUrl: finalAvatarUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully!');
        navigate(`/user/${user?.uid}`);
      } else {
        setError(data.message || 'Failed to update profile');
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      toast.error('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  // Show loading while auth is initializing or fetching profile
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {authLoading ? 'Checking authentication...' : 'Loading profile...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="font-semibold">{error}</p>
              </div>
              
              {error.includes('sync') && (
                <div className="space-y-2">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Your Firebase account exists, but you need to create a database profile first. This is a one-time setup that takes just a few seconds.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/sync-user')} variant="default" className="w-full">
                    Go to Sync Page
                  </Button>
                </div>
              )}
              
              {error.includes('session') && (
                <div className="space-y-2">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Your session has expired. Please logout and login again to refresh your authentication.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/')} variant="default" className="w-full">
                    Go to Home
                  </Button>
                </div>
              )}
              
              {error.includes('login') && (
                <Button onClick={() => navigate('/')} variant="default" className="w-full">
                  Go to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <title>Edit Profile - LiveStream Platform</title>
      <meta name="description" content="Edit your profile information" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Profile Picture
                  </Label>
                  
                  <div className="flex items-center gap-6">
                    {/* Avatar Preview */}
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={avatarPreview || avatarUrl || undefined} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Upload Button */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          className="flex items-center gap-2"
                        >
                          <Image className="h-4 w-4" />
                          Choose Image
                        </Button>
                        {(avatarPreview || avatarUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setAvatarFile(null);
                              setAvatarPreview(null);
                              setAvatarUrl('');
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a profile picture (max 5MB, JPG, PNG, or GIF)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed
                  </p>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed through your account settings
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the name that will be shown to other users
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/user/${user?.uid}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
