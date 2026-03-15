/**
 * Mention Suggestions Component
 * Shows user suggestions when typing @ in textarea
 */

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';

interface User {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isLive: boolean;
}

interface MentionSuggestionsProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (username: string) => void;
  onClose: () => void;
}

export default function MentionSuggestions({
  query,
  position,
  onSelect,
  onClose,
}: MentionSuggestionsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data && data.success) {
          setUsers((data.users || []).slice(0, 5)); // Max 5 suggestions
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Mention search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (users[selectedIndex]) {
          onSelect(users[selectedIndex].username);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  if (users.length === 0 && !loading) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '280px',
        maxWidth: '320px',
      }}
    >
      {loading && (
        <div className="p-3 text-sm text-muted-foreground text-center">
          Buscando...
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="max-h-[240px] overflow-y-auto">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelect(user.username)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>
                  {user.displayName?.[0] || user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">
                    {user.displayName || user.username}
                  </p>
                  {user.isLive && (
                    <Badge variant="destructive" className="text-xs h-5">
                      <Radio className="h-2.5 w-2.5 mr-1" />
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
        ↑↓ navegar • Enter seleccionar • Esc cerrar
      </div>
    </div>
  );
}
