/**
 * Viewers List Component
 * Shows current viewers with clickable profiles
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import ProfileModal from './ProfileModal';
import { Users, Eye, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Viewer {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isModerator?: boolean;
}

interface ViewersListProps {
  viewers: Viewer[];
  viewerCount: number;
  isBroadcaster?: boolean;
}

export default function ViewersList({
  viewers,
  viewerCount,
  isBroadcaster = false,
}: ViewersListProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleViewerClick = (userId: number) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="font-semibold">{viewerCount}</span>
            <span className="hidden sm:inline">
              {viewerCount === 1 ? 'viewer' : 'viewers'}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Viewers ({viewerCount})
            </SheetTitle>
            <SheetDescription>
              {isBroadcaster
                ? 'Click on a viewer to see their profile'
                : 'People watching this stream'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-2">
              <AnimatePresence>
                {viewers.map((viewer, index) => (
                  <motion.div
                    key={viewer.userId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleViewerClick(viewer.userId)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={viewer.avatarUrl || undefined} />
                        <AvatarFallback>
                          {viewer.displayName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {viewer.displayName}
                          </p>
                          {viewer.isModerator && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Mod
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{viewer.username}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {viewers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No viewers yet</p>
                  <p className="text-sm">Share your stream to get viewers!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          userId={selectedUserId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />
      )}
    </>
  );
}
