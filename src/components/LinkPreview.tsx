import { useState, useEffect } from 'react';
import { ExternalLink, Radio, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string;
}

interface LivestreamPreviewData {
  type: 'livestream';
  streamId: number;
  slug: string | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  viewerCount: number;
  isLive: boolean;
  broadcaster: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  startedAt: string;
  isSystemStream: boolean;
}

interface LinkPreviewProps {
  url: string;
  /** Called once metadata is fetched — use to cache it in parent */
  onMetadataFetched?: (metadata: LinkPreviewData) => void;
  /** Show a remove (X) button */
  showRemove?: boolean;
  /** Called when user clicks the X button */
  onRemove?: () => void;
  /** Pre-loaded metadata — skips the fetch entirely */
  cachedMetadata?: LinkPreviewData | null;
}

export default function LinkPreview({ url, onMetadataFetched, showRemove, onRemove, cachedMetadata }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | LivestreamPreviewData | null>(cachedMetadata ?? null);
  const [loading, setLoading] = useState(!cachedMetadata);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If we already have cached metadata, skip the fetch
    if (cachedMetadata) {
      setPreview(cachedMetadata);
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        console.log('🔗 Fetching preview for URL:', url);
        setLoading(true);
        setError(false);

        // Check if URL is a livestream link
        const streamMatch = url.match(/\/stream\/([^/?]+)/);
        
        if (streamMatch) {
          const streamIdentifier = streamMatch[1];
          console.log('🎥 Detected livestream URL:', streamIdentifier);

          const response = await fetch('/api/streams/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamIdentifier }),
          });

          if (!response.ok) throw new Error('Failed to fetch stream preview');

          const data = await response.json();
          console.log('✅ Stream preview data received:', data);
          setPreview(data.preview);
        } else {
          // Regular link preview
          const response = await fetch('/api/link-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });

          console.log('📡 Response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Preview fetch failed:', errorData);
            throw new Error('Failed to fetch preview');
          }

          const data = await response.json();
          console.log('✅ Preview data received:', data);
          setPreview(data);

          // Notify parent with the fetched metadata
          if (onMetadataFetched && data && !('type' in data)) {
            onMetadataFetched(data as LinkPreviewData);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching link preview:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url, cachedMetadata]);

  // Remove button overlay — shared across all states
  const RemoveBtn = () =>
    showRemove && onRemove ? (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-background border border-border hover:bg-muted shadow-sm transition-colors"
        aria-label="Quitar preview"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    ) : null;

  if (loading) {
    return (
      <div className="relative">
        <RemoveBtn />
        <Card className="overflow-hidden border border-border animate-pulse">
          <div className="flex gap-4 p-4">
            <div className="w-24 h-24 bg-muted rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="relative">
        <RemoveBtn />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="overflow-hidden border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <div className="flex gap-4 p-4">
              <div className="w-12 h-12 flex-shrink-0 bg-muted rounded flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2 text-foreground break-all">{url}</h3>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {new URL(url).hostname}
                </p>
              </div>
            </div>
          </Card>
        </a>
      </div>
    );
  }

  // Livestream preview
  if ('type' in preview && preview.type === 'livestream') {
    const streamUrl = preview.slug ? `/stream/${preview.slug}` : `/stream/${preview.streamId}`;
    return (
      <div className="relative">
        <RemoveBtn />
        <a href={streamUrl} className="block no-underline" onClick={(e) => e.stopPropagation()}>
          <Card className="overflow-hidden border-2 border-primary/50 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex gap-4">
              <div className="w-32 h-32 flex-shrink-0 bg-muted relative">
                {preview.thumbnailUrl ? (
                  <img src={preview.thumbnailUrl} alt={preview.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Radio className="h-12 w-12 text-primary" />
                  </div>
                )}
                {preview.isLive && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="bg-red-600 text-white font-semibold animate-pulse">
                      <Radio className="h-3 w-3 mr-1" />LIVE
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base line-clamp-2 text-foreground">{preview.title}</h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={preview.broadcaster.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">{preview.broadcaster.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {preview.broadcaster.displayName || preview.broadcaster.username}
                  </span>
                </div>
                {preview.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{preview.description}</p>
                )}
                {preview.isLive && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{preview.viewerCount}</span>
                    <span>watching now</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </a>
      </div>
    );
  }

  // Regular link preview
  const regularPreview = preview as LinkPreviewData;
  return (
    <div className="relative">
      <RemoveBtn />
      <a
        href={regularPreview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="overflow-hidden border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <div className="flex gap-4">
            {regularPreview.image && (
              <div className="w-32 h-32 flex-shrink-0 bg-muted">
                <img src={regularPreview.image} alt={regularPreview.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{regularPreview.title}</h3>
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              {regularPreview.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{regularPreview.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2 truncate">{regularPreview.siteName}</p>
            </div>
          </div>
        </Card>
      </a>
    </div>
  );
}
