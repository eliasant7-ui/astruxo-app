/**
 * MessageModerationMenu Component
 * Context menu for moderating chat messages
 */

import { Trash2, UserX, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-fetch';

interface MessageModerationMenuProps {
  streamId: number;
  messageId: string;
  userId: number;
  username: string;
  content: string;
  isBroadcaster: boolean;
  isModerator: boolean;
  onMessageDeleted: (messageId: string) => void;
  onUserBanned: (userId: number) => void;
}

export default function MessageModerationMenu({
  streamId,
  messageId,
  userId,
  username,
  content,
  isBroadcaster,
  isModerator,
  onMessageDeleted,
  onUserBanned,
}: MessageModerationMenuProps) {
  const canModerate = isBroadcaster || isModerator;

  if (!canModerate) {
    return null;
  }

  const handleDeleteMessage = async () => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/messages`, {
        method: 'DELETE',
        body: JSON.stringify({
          messageId,
          userId,
          content,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Message deleted');
        onMessageDeleted(messageId);
      } else {
        toast.error(data.message || 'Failed to delete message');
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleKickUser = async () => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/bans`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          banType: 'kick',
          reason: 'Kicked by moderator',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${username} has been kicked`);
        onUserBanned(userId);
      } else {
        toast.error(data.message || 'Failed to kick user');
      }
    } catch (error) {
      toast.error('Failed to kick user');
    }
  };

  const handleBanUser = async () => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/bans`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          banType: 'ban',
          reason: 'Banned by broadcaster',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${username} has been permanently banned`);
        onUserBanned(userId);
      } else {
        toast.error(data.message || 'Failed to ban user');
      }
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="sr-only">Moderate</span>
          <span className="text-xs">⋮</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDeleteMessage}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleKickUser}>
          <UserX className="h-4 w-4 mr-2" />
          Kick User
        </DropdownMenuItem>
        {isBroadcaster && (
          <DropdownMenuItem onClick={handleBanUser} className="text-red-600">
            <Ban className="h-4 w-4 mr-2" />
            Ban User (Permanent)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
