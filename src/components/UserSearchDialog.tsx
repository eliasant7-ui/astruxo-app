/**
 * User Search Dialog Component
 * Modal for searching users by username or display name
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Radio, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isLive: boolean;
}

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    console.log('🔍 Query changed:', query);
    
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const searchUsers = async () => {
      console.log('🔍 Starting search for:', query);
      setLoading(true);
      try {
        const url = `/api/users/search?q=${encodeURIComponent(query)}`;
        console.log('🔍 Fetching:', url);
        
        const response = await fetch(url);
        console.log('🔍 Response status:', response.status);
        
        const data = await response.json();
        console.log('🔍 Response data:', data);
        
        if (data && data.success) {
          console.log('✅ Found users:', data.users.length);
          setResults(data.users || []);
          setHasSearched(true);
        } else {
          console.log('❌ No success in response');
          setResults([]);
          setHasSearched(true);
        }
      } catch (error) {
        console.error('❌ Search error:', error);
        toast.error('Error al buscar usuarios');
        setResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search - wait for user to stop typing
    console.log('⏱️ Setting debounce timer (500ms)');
    const timer = setTimeout(searchUsers, 500);
    return () => {
      console.log('🧹 Clearing debounce timer');
      clearTimeout(timer);
    };
  }, [query]);

  const handleUserClick = (userId: number) => {
    navigate(`/user/${userId}`);
    onOpenChange(false);
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buscar Usuarios</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o usuario..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Loading State - Only show while actively searching */}
            {loading && query.trim() && (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-3"></div>
                <p className="text-sm text-muted-foreground">Buscando usuarios...</p>
              </div>
            )}

            {/* No Results - Only show after search completes */}
            {!loading && hasSearched && query.trim() && results.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No se encontraron usuarios</p>
                <p className="text-sm text-muted-foreground">
                  Intenta con otro nombre o usuario
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && results.length > 0 && (
              <div className="space-y-1">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {user.displayName?.[0] || user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {user.displayName || user.username}
                        </p>
                        {user.isLive && (
                          <Badge variant="destructive" className="text-xs">
                            <Radio className="h-3 w-3 mr-1" />
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{user.username} • {user.followerCount} seguidores
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty State - Show when no search has been made */}
            {!query.trim() && !loading && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Buscar usuarios</p>
                <p className="text-sm text-muted-foreground">
                  Escribe un nombre o usuario para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
