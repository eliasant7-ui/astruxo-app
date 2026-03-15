import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ImageIcon, VideoIcon, X, Loader2, Radio } from 'lucide-react';
import LinkPreview from '@/components/LinkPreview';

interface CreatePostProps {
  onPostCreated?: (post?: any) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [liveStream, setLiveStream] = useState<any>(null);
  const [sharingStream, setSharingStream] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = useRef(false);
  const lastCheckedTextRef = useRef<string>('');

  // Link preview detection
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [linkMetadata, setLinkMetadata] = useState<any>(null);
  const [linkPreviewDismissed, setLinkPreviewDismissed] = useState(false);

  /**
   * Extracts the first valid URL from text.
   * Handles: https://, http://, www., and bare domains.
   */
  const extractFirstUrl = (text: string): string | null => {
    if (!text) return null;

    // Primary: explicit http/https URLs
    const httpMatch = text.match(/(https?:\/\/[^\s<>"'{}|\\^`[\]]+)/);
    if (httpMatch) {
      return httpMatch[1].replace(/[.,;:!?)]+$/, '');
    }

    // Secondary: www. URLs
    const wwwMatch = text.match(/(www\.[^\s<>"'{}|\\^`[\]]{3,})/);
    if (wwwMatch) {
      const url = 'https://' + wwwMatch[1].replace(/[.,;:!?)]+$/, '');
      try { new URL(url); return url; } catch { /* invalid */ }
    }

    // Tertiary: bare domain (e.g. google.com/path) — only after a space or start of line
    const bareMatch = text.match(/(?:^|\s)([a-zA-Z0-9][a-zA-Z0-9-]{1,61}\.[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`[\]]*)?)/);
    if (bareMatch) {
      const url = 'https://' + bareMatch[1].replace(/[.,;:!?)]+$/, '');
      try { new URL(url); return url; } catch { /* invalid */ }
    }

    return null;
  };

  /**
   * Core URL detection logic — called from multiple triggers.
   * Uses lastCheckedTextRef to avoid redundant state updates.
   */
  const detectUrlInText = (text: string) => {
    if (text === lastCheckedTextRef.current) return;
    lastCheckedTextRef.current = text;

    const url = extractFirstUrl(text);

    if (!url) {
      if (detectedUrl) {
        setDetectedUrl(null);
        setLinkMetadata(null);
        setLinkPreviewDismissed(false);
      }
      return;
    }

    if (url !== detectedUrl) {
      setDetectedUrl(url);
      setLinkMetadata(null);
      setLinkPreviewDismissed(false);
    }
  };

  // Check if user has an active livestream
  useEffect(() => {
    const checkLiveStream = async () => {
      if (!user || !token) return;
      try {
        const response = await fetch('/api/streams/my-active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.stream && data.stream.status === 'live') {
            setLiveStream(data.stream);
          }
        }
      } catch (error) {
        console.error('Error checking live stream:', error);
      }
    };
    checkLiveStream();
  }, [user, token]);

  // Polling interval: re-check every 300ms while the textarea is active
  // Catches cases where the user types slowly or pastes without triggering onChange
  useEffect(() => {
    const interval = setInterval(() => {
      const text = textareaRef.current?.value ?? '';
      detectUrlInText(text);
    }, 300);

    return () => clearInterval(interval);
  }, [detectedUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagen demasiado grande. Máximo 10MB.');
      return;
    }
    setMediaFile(file);
    setMediaType('image');
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video demasiado grande. Máximo 100MB.');
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 300) {
        toast.error('Video demasiado largo. Máximo 5 minutos.');
        return;
      }
      setMediaFile(file);
      setMediaType('video');
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    };
    video.onerror = () => toast.error('No se pudo cargar el video.');
    video.src = URL.createObjectURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setSharingStream(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleShareStream = () => {
    if (!liveStream) return;
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setSharingStream(true);
    if (!content.trim()) {
      setContent(`🔴 ¡Estoy EN VIVO! Únete: ${liveStream.title || 'Sin título'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Leer contenido directamente del DOM (más confiable en iOS)
    const trimmedContent = textareaRef.current?.value?.trim() || content.trim();

    if (isSubmittingRef.current) return;
    if (!user) { toast.error('Debes iniciar sesión para publicar'); return; }
    if (!trimmedContent && !mediaFile && !sharingStream) {
      toast.error('Escribe algo o adjunta un archivo');
      return;
    }

    isSubmittingRef.current = true;
    setUploading(true);

    try {
      // Token fresco
      console.log('1️⃣ Obteniendo token...');
      const freshToken = await user.getIdToken(true);
      if (!freshToken) {
        toast.error('Error de autenticación');
        return;
      }
      console.log('2️⃣ Token obtenido');

      let mediaUrl: string | null = null;

      if (mediaFile && mediaType) {
        const formData = new FormData();
        formData.append(mediaType, mediaFile);
        const uploadEndpoint = mediaType === 'image' ? '/api/upload/image' : '/api/upload/video';
        const uploadResponse = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${freshToken}` },
          body: formData,
        });
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Error al subir el archivo');
        }
        const uploadData = await uploadResponse.json();
        mediaUrl = uploadData.url;
      }

      const postData: any = { content: trimmedContent || null };
      if (sharingStream && liveStream) {
        postData.streamId = liveStream.id;
        postData.mediaType = 'livestream';
      } else if (mediaType && mediaUrl) {
        postData.mediaType = mediaType;
        postData.mediaUrl = mediaUrl;
      }
      // Attach cached link preview metadata if available
      if (linkMetadata) {
        postData.linkPreview = linkMetadata;
      }

      console.log('3️⃣ Enviando POST a /api/posts');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify(postData),
      });

      console.log('4️⃣ Respuesta recibida, status:', response.status);

      // Leer como texto primero para debugging
      const responseText = await response.text();
      console.log('5️⃣ Respuesta raw:', responseText);

      if (!response.ok) {
        throw new Error(responseText || 'Error al crear la publicación');
      }

      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error('❌ Error parseando JSON:', responseText);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('6️⃣ Éxito! Post creado:', result.post?.id);

      // ✅ Limpiar textarea inmediatamente — DOM + estado
      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.blur(); // Cierra teclado iOS
      }
      setContent('');
      removeMedia();

      // Limpiar link preview
      setDetectedUrl(null);
      setLinkMetadata(null);
      setLinkPreviewDismissed(false);
      lastCheckedTextRef.current = '';

      toast.success('¡Publicación creada!');

      // Notificar al feed con el post completo
      if (onPostCreated && result.post) {
        console.log('7️⃣ Notificando al feed');
        onPostCreated(result.post);
      }

      console.log('✅ Todo completado!');

    } catch (error) {
      console.error('❌ Error en submit:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la publicación');
    } finally {
      isSubmittingRef.current = false;
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            ref={textareaRef}
            defaultValue=""
            onChange={(e) => {
              setContent(e.target.value);
              // Immediate detection on every keystroke / paste
              detectUrlInText(e.target.value);
            }}
            rows={3}
            className="resize-none"
            disabled={uploading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
              // Detect on Space — user just finished typing a URL word
              if (e.key === ' ') {
                setTimeout(() => {
                  detectUrlInText(textareaRef.current?.value ?? '');
                }, 50);
              }
            }}
          />

          {/* Link Preview — shown when a URL is detected in the text */}
          {detectedUrl && !linkPreviewDismissed && (
            <LinkPreview
              url={detectedUrl}
              onMetadataFetched={(meta) => setLinkMetadata(meta)}
              showRemove={true}
              onRemove={() => {
                setLinkMetadata(null);
                setLinkPreviewDismissed(true);
              }}
            />
          )}

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              {mediaType === 'image' && (
                <img src={mediaPreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
              )}
              {mediaType === 'video' && (
                <video src={mediaPreview} controls preload="metadata" playsInline
                  className="w-full h-64 object-cover rounded-lg" controlsList="nodownload" />
              )}
              <Button type="button" variant="destructive" size="icon"
                className="absolute top-2 right-2" onClick={removeMedia}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Stream Preview */}
          {sharingStream && liveStream && (
            <div className="relative">
              <Card className="overflow-hidden border-2 border-red-500/50">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-muted rounded relative">
                    {liveStream.thumbnailUrl
                      ? <img src={liveStream.thumbnailUrl} alt={liveStream.title} className="w-full h-full object-cover rounded" />
                      : <div className="w-full h-full flex items-center justify-center bg-red-500/10 rounded">
                          <Radio className="h-8 w-8 text-red-500" />
                        </div>
                    }
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-2">{liveStream.title || 'Sin título'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{liveStream.viewerCount || 0} viendo ahora</p>
                  </div>
                </div>
              </Card>
              <Button type="button" variant="destructive" size="icon"
                className="absolute top-2 right-2" onClick={removeMedia}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input ref={imageInputRef} type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageSelect} className="hidden" />
              <Button type="button" variant="outline" size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={!!mediaFile || uploading || sharingStream}>
                <ImageIcon className="h-4 w-4 mr-2" /> Imagen
              </Button>

              <input ref={videoInputRef} type="file"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleVideoSelect} className="hidden" />
              <Button type="button" variant="outline" size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!mediaFile || uploading || sharingStream}>
                <VideoIcon className="h-4 w-4 mr-2" /> Video
              </Button>

              {liveStream && (
                <Button type="button" size="sm"
                  variant={sharingStream ? 'default' : 'outline'}
                  onClick={handleShareStream}
                  disabled={!!mediaFile || uploading}
                  className={sharingStream ? 'bg-red-600 hover:bg-red-700' : ''}>
                  <Radio className="h-4 w-4 mr-2" />
                  {sharingStream ? 'Compartiendo' : 'Compartir stream'}
                </Button>
              )}
            </div>

            <Button type="submit" disabled={uploading || (!content.trim() && !mediaFile && !sharingStream)}>
              {uploading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publicando...</>
                : 'Publicar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
