/**
 * ModerationPanel Component
 * Panel for broadcaster to manage moderators and stream privacy
 */

import { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, UserPlus, UserMinus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, TransparentDialogContent } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-fetch';

interface Moderator {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  assignedAt: string;
}

interface Gift {
  id: number;
  name: string;
  coinPrice: number;
  emoji: string;
}

interface ModerationPanelProps {
  streamId: number;
  isPrivate: boolean;
  requiredGiftId: number | null;
  viewers: any[];
  onPrivacyChange: (isPrivate: boolean, giftId: number | null) => void;
}

export default function ModerationPanel({
  streamId,
  isPrivate,
  requiredGiftId,
  viewers,
  onPrivacyChange,
}: ModerationPanelProps) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [showAddModerator, setShowAddModerator] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(requiredGiftId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModerators();
    fetchGifts();
  }, [streamId]);

  const fetchModerators = async () => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/moderators`);
      const data = await response.json();
      if (data.success) {
        setModerators(data.moderators);
      }
    } catch (error) {
      console.error('Error fetching moderators:', error);
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await fetch('/api/gifts');
      const data = await response.json();
      if (data.success) {
        setGifts(data.gifts);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  };

  const handleAddModerator = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/streams/${streamId}/moderators`, {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Moderator assigned successfully');
        fetchModerators();
        setShowAddModerator(false);
        setSelectedUserId(null);
      } else {
        toast.error(data.message || 'Failed to assign moderator');
      }
    } catch (error) {
      toast.error('Failed to assign moderator');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModerator = async (userId: number) => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/streams/${streamId}/moderators`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Moderator removed');
        fetchModerators();
      } else {
        toast.error(data.message || 'Failed to remove moderator');
      }
    } catch (error) {
      toast.error('Failed to remove moderator');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    const newIsPrivate = !isPrivate;
    
    console.log('🔒 Toggle Privacy:', { 
      currentIsPrivate: isPrivate, 
      newIsPrivate, 
      selectedGiftId,
      selectedGiftIdType: typeof selectedGiftId,
      selectedGiftIdTruthy: !!selectedGiftId
    });
    
    if (newIsPrivate && !selectedGiftId) {
      toast.error('Please select a required gift');
      return;
    }

    setLoading(true);
    try {
      console.log('🔒 Sending privacy request to API...');
      const response = await apiFetch(`/api/streams/${streamId}/private`, {
        method: 'POST',
        body: JSON.stringify({
          isPrivate: newIsPrivate,
          requiredGiftId: newIsPrivate ? selectedGiftId : null,
        }),
      });

      const data = await response.json();
      console.log('🔒 API Response:', data);
      
      if (data.success) {
        toast.success(data.message);
        console.log('🔒 Calling onPrivacyChange with:', { newIsPrivate, giftId: newIsPrivate ? selectedGiftId : null });
        onPrivacyChange(newIsPrivate, newIsPrivate ? selectedGiftId : null);
        setShowPrivacyDialog(false);
      } else {
        console.error('🔒 API Error:', data.message);
        toast.error(data.message || 'Failed to update privacy');
      }
    } catch (error) {
      console.error('🔒 Exception:', error);
      toast.error('Failed to update privacy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Moderation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Privacy Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPrivate ? (
              <Lock className="h-4 w-4 text-yellow-500" />
            ) : (
              <Unlock className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-medium">
              {isPrivate ? 'Private Stream' : 'Public Stream'}
            </span>
          </div>
          <Button
            size="sm"
            variant={isPrivate ? 'destructive' : 'default'}
            onClick={() => {
              if (isPrivate) {
                // Make public directly
                handleTogglePrivacy();
              } else {
                // Make private - show dialog to select gift
                setShowPrivacyDialog(true);
              }
            }}
          >
            {isPrivate ? 'Make Public' : 'Make Private'}
          </Button>
        </div>

        {/* Moderators List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Moderators ({moderators.length}/3)
            </span>
            {moderators.length < 3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddModerator(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>

          {moderators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moderators assigned</p>
          ) : (
            <div className="space-y-2">
              {moderators.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={mod.avatarUrl || '/default-avatar.png'}
                      alt={mod.displayName}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{mod.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{mod.username}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Mod
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveModerator(mod.userId)}
                    disabled={loading}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Moderator Dialog */}
        <Dialog open={showAddModerator} onOpenChange={setShowAddModerator}>
          <TransparentDialogContent className="bg-black/60 backdrop-blur-xl border-white/30 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold">Add Moderator</DialogTitle>
              <DialogDescription className="text-white/80">
                Select a viewer to make them a moderator. They can delete messages and kick users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={selectedUserId?.toString()}
                onValueChange={(value) => setSelectedUserId(parseInt(value))}
              >
                <SelectTrigger className="bg-white/15 border-white/30 text-white hover:bg-white/20">
                  <SelectValue placeholder="Select a viewer" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-xl border-white/30">
                  {viewers && viewers.length > 0 ? (
                    viewers
                      .filter((viewer) => viewer && (viewer.userId || viewer.id))
                      .map((viewer) => {
                        const id = viewer.userId || viewer.id;
                        return (
                          <SelectItem key={id} value={id.toString()} className="text-white hover:bg-white/20 focus:bg-white/20">
                            {viewer.displayName || viewer.username || 'Unknown'} 
                            {viewer.username && ` (@${viewer.username})`}
                          </SelectItem>
                        );
                      })
                  ) : (
                    <SelectItem value="no-viewers" disabled className="text-white/50">
                      No viewers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModerator(false)} className="bg-white/15 border-white/30 text-white hover:bg-white/25">
                Cancel
              </Button>
              <Button onClick={handleAddModerator} disabled={loading || !selectedUserId} className="bg-primary hover:bg-primary/90 text-white font-medium">
                Add Moderator
              </Button>
            </DialogFooter>
          </TransparentDialogContent>
        </Dialog>

        {/* Privacy Dialog */}
        <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
          <TransparentDialogContent className="bg-black/60 backdrop-blur-xl border-white/30 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold">
                {isPrivate ? 'Make Stream Public' : 'Make Stream Private'}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {isPrivate
                  ? 'Anyone will be able to watch your stream'
                  : 'Viewers will need to send a gift to enter your stream'}
              </DialogDescription>
            </DialogHeader>
            {!isPrivate && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-white">Required Gift</label>
                <Select
                  value={selectedGiftId?.toString()}
                  onValueChange={(value) => setSelectedGiftId(parseInt(value))}
                >
                  <SelectTrigger className="bg-white/15 border-white/30 text-white hover:bg-white/20">
                    <SelectValue placeholder="Select a gift" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 backdrop-blur-xl border-white/30">
                    {gifts.map((gift) => (
                      <SelectItem key={gift.id} value={gift.id.toString()} className="text-white hover:bg-white/20 focus:bg-white/20">
                        {gift.emoji} {gift.name} - {gift.coinPrice} coins
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrivacyDialog(false)} className="bg-white/15 border-white/30 text-white hover:bg-white/25">
                Cancel
              </Button>
              <Button onClick={handleTogglePrivacy} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-medium">
                {isPrivate ? 'Make Public' : 'Make Private'}
              </Button>
            </DialogFooter>
          </TransparentDialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
