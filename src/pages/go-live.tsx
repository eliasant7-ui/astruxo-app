/**
 * Go Live Page
 * Interface for creators to start a live stream
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Radio, Video, Target, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import PreLiveConfirmation from '@/components/PreLiveConfirmation';

export default function GoLivePage() {
  const navigate = useNavigate();
  const { user, refreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showPreLiveDialog, setShowPreLiveDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Function to sync user to database
  const handleSyncUser = async () => {
    if (!user) {
      setError('Please login first');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const token = await refreshToken();
      
      if (!token) {
        setError('Failed to authenticate. Please login again.');
        setSyncing(false);
        return;
      }

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSyncSuccess(true);
        setError(null);
        alert('✅ User synced successfully! You can now create streams.');
      } else {
        setError(data.message || 'Failed to sync user');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync user');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a stream title');
      return;
    }

    if (!user) {
      setError('Please login to start streaming');
      return;
    }

    // Open pre-live confirmation dialog
    setShowPreLiveDialog(true);
  };

  const handlePreLiveConfirm = async (settings: { goalAmount?: number; entryPrice?: number; thumbnailFile?: File }) => {
    setShowPreLiveDialog(false);
    setLoading(true);
    setError(null);

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000; // 2 seconds
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Refresh token with retry logic
      let token: string | null = null;
      let tokenAttempt = 0;

      while (tokenAttempt < MAX_RETRIES) {
        try {
          console.log(`🔄 Refreshing token (attempt ${tokenAttempt + 1}/${MAX_RETRIES})...`);
          token = await refreshToken();

          if (token) {
            console.log('✅ Token refreshed successfully');
            break;
          }

          tokenAttempt++;
          if (tokenAttempt < MAX_RETRIES) {
            console.log(`⚠️ Token refresh failed, retrying in ${RETRY_DELAY_MS}ms...`);
            await delay(RETRY_DELAY_MS);
          }
        } catch (tokenError) {
          console.error('❌ Token refresh error:', tokenError);
          tokenAttempt++;
          if (tokenAttempt < MAX_RETRIES) {
            await delay(RETRY_DELAY_MS);
          }
        }
      }

      if (!token) {
        console.error(`❌ No token received after ${MAX_RETRIES} attempts`);
        setError('Failed to authenticate. Please login again.');
        setLoading(false);
        return;
      }

      console.log('✅ Token refreshed, starting stream...');
      console.log('📤 Making request to /api/streams/start');

      // Upload thumbnail first if provided
      let thumbnailUrl: string | undefined;
      if (settings.thumbnailFile) {
        console.log('📸 Uploading thumbnail...');
        const formData = new FormData();
        formData.append('image', settings.thumbnailFile);

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          thumbnailUrl = uploadData.url;
          console.log('✅ Thumbnail uploaded:', thumbnailUrl);
        } else {
          console.error('❌ Thumbnail upload failed:', uploadData.message);
          // Continue without thumbnail, don't fail the entire operation
        }
      }

      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        goalAmount: settings.goalAmount,
        entryPrice: settings.entryPrice,
        thumbnailUrl,
      };

      console.log('🎯 Creating stream with settings:', requestBody);

      // Create stream with retry logic
      let streamCreateAttempt = 0;
      let response: Response | null = null;

      while (streamCreateAttempt < MAX_RETRIES) {
        try {
          console.log(`📤 Creating stream (attempt ${streamCreateAttempt + 1}/${MAX_RETRIES})...`);

          response = await fetch('/api/streams/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });

          console.log('📥 Response status:', response.status);

          // If we get a 409 Conflict (concurrent stream), retry
          if (response.status === 409) {
            console.log('⚠️ Stream conflict detected, retrying...');
            streamCreateAttempt++;
            if (streamCreateAttempt < MAX_RETRIES) {
              await delay(RETRY_DELAY_MS);
              continue;
            }
          }

          // If we get a 500 error, retry once
          if (response.status >= 500 && response.status < 600) {
            console.log('⚠️ Server error, retrying...');
            streamCreateAttempt++;
            if (streamCreateAttempt < MAX_RETRIES) {
              await delay(RETRY_DELAY_MS);
              continue;
            }
          }

          // Success or other error, break out of retry loop
          break;
        } catch (fetchError) {
          console.error('❌ Stream creation network error:', fetchError);
          streamCreateAttempt++;
          if (streamCreateAttempt < MAX_RETRIES) {
            console.log(`⚠️ Retrying in ${RETRY_DELAY_MS}ms...`);
            await delay(RETRY_DELAY_MS);
          }
        }
      }

      if (!response) {
        setError('Failed to connect to server. Please try again.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        console.log('✅ Stream started successfully:', data.stream.id);

        // Store stream credentials
        localStorage.setItem('streamCredentials', JSON.stringify(data.credentials));

        // Navigate to broadcaster page
        navigate(`/broadcast/${data.stream.id}`);
      } else {
        console.error('❌ Failed to start stream:', data.message);
        setError(data.message || 'Failed to start stream');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Start stream error:', err);
      setError('Failed to connect to server. Please try again.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <title>Go Live - LiveStream Platform</title>
      <meta name="description" content="Start your live stream and connect with your audience" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Video className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold">Go Live</h1>
            </div>
            <p className="text-muted-foreground">
              Start your live stream and connect with your audience in real-time
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Stream Details</CardTitle>
              <CardDescription>
                Tell your viewers what your stream is about
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {syncSuccess && (
                  <div className="bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                    ✅ User synced successfully! You can now create streams.
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                    <p className="font-semibold mb-2">{error}</p>
                    {error.includes('User not found in database') && (
                      <div className="mt-3">
                        <p className="text-sm mb-2">
                          Your Firebase account needs to be synced to the database.
                        </p>
                        <Button
                          type="button"
                          onClick={handleSyncUser}
                          disabled={syncing}
                          variant="outline"
                          size="sm"
                        >
                          {syncing ? 'Syncing...' : 'Sync User to Database'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Stream Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What are you streaming today?"
                    maxLength={255}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.title.length}/255 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add more details about your stream..."
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Before you go live:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Make sure you have a stable internet connection</li>
                    <li>• Test your camera and microphone</li>
                    <li>• Choose a well-lit location</li>
                    <li>• Be ready to engage with your audience</li>
                    <li>• You can set monetization options in the next step</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !formData.title.trim()}
                >
                  {loading ? (
                    'Starting Stream...'
                  ) : (
                    <>
                      <Radio className="h-5 w-5 mr-2" />
                      Start Live Stream
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Need help? Check out our{' '}
              <a href="#" className="text-primary hover:underline">
                streaming guide
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Pre-Live Confirmation Dialog */}
      <PreLiveConfirmation
        open={showPreLiveDialog}
        onConfirm={handlePreLiveConfirm}
        onCancel={() => setShowPreLiveDialog(false)}
      />
    </>
  );
}
