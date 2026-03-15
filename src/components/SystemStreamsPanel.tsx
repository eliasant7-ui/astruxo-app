/**
 * System Streams Management Panel
 * Allows admins to manage 24/7 system streams
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, Radio, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

interface SystemStream {
  id: number;
  title: string;
  description: string | null;
  youtubePlaylistId: string | null;
  currentPlaylistIndex: number;
  status: string;
  viewerCount: number;
}

export default function SystemStreamsPanel() {
  const [streams, setStreams] = useState<SystemStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    youtubePlaylistId: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-streams');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system streams');
      }

      const data = await response.json();
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Error fetching system streams:', error);
      toast.error('Failed to load system streams');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (stream: SystemStream) => {
    setEditingId(stream.id);
    setEditForm({
      title: stream.title,
      description: stream.description || '',
      youtubePlaylistId: stream.youtubePlaylistId || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '', youtubePlaylistId: '' });
  };

  const saveChanges = async (streamId: number) => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/system-streams/${streamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update stream');
      }

      toast.success('Stream updated successfully');
      setEditingId(null);
      fetchStreams();
    } catch (error) {
      console.error('Error updating stream:', error);
      toast.error('Failed to update stream');
    } finally {
      setSaving(false);
    }
  };

  const resetProgress = async (streamId: number) => {
    try {
      const response = await fetch(`/api/admin/system-streams/${streamId}/reset-progress`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset progress');
      }

      toast.success('Progress reset to video 0');
      fetchStreams();
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error('Failed to reset progress');
    }
  };

  const toggleStatus = async (streamId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'live' ? 'ended' : 'live';
      
      const response = await fetch(`/api/admin/system-streams/${streamId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Stream ${newStatus === 'live' ? 'activated' : 'deactivated'}`);
      fetchStreams();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">24/7 System Streams</h2>
          <p className="text-muted-foreground">Manage your always-on YouTube playlist channels</p>
        </div>
        <Button onClick={fetchStreams} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {streams.map((stream) => (
          <Card key={stream.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-xl">
                      {editingId === stream.id ? (
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Stream title"
                          className="max-w-md"
                        />
                      ) : (
                        stream.title
                      )}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Stream ID: {stream.id} • Current viewers: {stream.viewerCount}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={stream.status === 'live' ? 'default' : 'secondary'}>
                    {stream.status === 'live' ? 'Live' : 'Offline'}
                  </Badge>
                  {editingId === stream.id ? (
                    <>
                      <Button
                        onClick={() => saveChanges(stream.id)}
                        disabled={saving}
                        size="sm"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => startEditing(stream)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <Label>Description</Label>
                {editingId === stream.id ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Stream description"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {stream.description || 'No description'}
                  </p>
                )}
              </div>

              {/* YouTube Playlist ID */}
              <div>
                <Label>YouTube Playlist ID</Label>
                {editingId === stream.id ? (
                  <Input
                    value={editForm.youtubePlaylistId}
                    onChange={(e) => setEditForm({ ...editForm, youtubePlaylistId: e.target.value })}
                    placeholder="PLxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                ) : (
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md mt-1">
                    {stream.youtubePlaylistId || 'No playlist set'}
                  </p>
                )}
                {editingId === stream.id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Find the playlist ID in the YouTube URL: youtube.com/playlist?list=<strong>PLxxx...</strong>
                  </p>
                )}
              </div>

              {/* Current Progress */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Current Video Index</p>
                  <p className="text-2xl font-bold">{stream.currentPlaylistIndex}</p>
                </div>
                <Button
                  onClick={() => resetProgress(stream.id)}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to 0
                </Button>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Stream Status</p>
                  <p className="text-xs text-muted-foreground">
                    {stream.status === 'live' ? 'Stream is currently live' : 'Stream is offline'}
                  </p>
                </div>
                <Switch
                  checked={stream.status === 'live'}
                  onCheckedChange={() => toggleStatus(stream.id, stream.status)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {streams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No system streams found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
