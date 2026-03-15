/**
 * Viewer View Component
 * Agora video integration for audience with automatic reconnection.
 *
 * Reconnection strategy:
 *  - On network-error or connection-state-change → exponential backoff (1s, 2s, 4s, 8s, max 30s)
 *  - Max 8 attempts before showing a manual "Retry" button
 *  - Cleans up all Agora resources before each reconnect attempt
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { AlertCircle, Users, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewerViewProps {
  credentials: {
    appId: string;
    channelName: string;
    token: string;
    uid: number;
  };
  onError?: (error: string) => void;
  muteAudio?: boolean;
}

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

export default function ViewerView({ credentials, onError, muteAudio = false }: ViewerViewProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const unmountedRef = useRef(false);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (clientRef.current) {
      try {
        clientRef.current.removeAllListeners();
        await clientRef.current.leave();
      } catch { /* ignore */ }
      clientRef.current = null;
    }
  }, []);

  // ── Schedule reconnect with exponential backoff ────────────────────────────
  const scheduleReconnect = useCallback(() => {
    if (unmountedRef.current) return;
    const attempt = retryCountRef.current + 1;
    if (attempt > MAX_RETRIES) {
      setGaveUp(true);
      setReconnecting(false);
      return;
    }
    retryCountRef.current = attempt;
    setReconnectAttempt(attempt);
    setReconnecting(true);

    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
    console.log(`🔄 Reconectando en ${delay}ms (intento ${attempt}/${MAX_RETRIES})...`);

    retryTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) joinChannel();
    }, delay);
  }, []);

  // ── Join channel ───────────────────────────────────────────────────────────
  const joinChannel = useCallback(async () => {
    if (unmountedRef.current) return;
    await cleanup();

    try {
      setError(null);
      setGaveUp(false);

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8', role: 'audience' });
      client.setLowStreamParameter({ width: 640, height: 360, framerate: 15, bitrate: 500 });
      clientRef.current = client;

      await client.setClientRole('audience', { level: 1 });

      // ── Network / connection events → auto-reconnect ─────────────────────
      client.on('connection-state-change', (curState, prevState) => {
        console.log(`📡 Agora state: ${prevState} → ${curState}`);
        if (curState === 'DISCONNECTED' && !unmountedRef.current) {
          setIsJoined(false);
          setIsPlaying(false);
          scheduleReconnect();
        }
        if (curState === 'CONNECTED') {
          retryCountRef.current = 0;
          setReconnecting(false);
          setReconnectAttempt(0);
          setIsJoined(true);
        }
      });

      client.on('exception', (evt) => {
        console.warn('⚠️ Agora exception:', evt);
      });

      // ── Media events ─────────────────────────────────────────────────────
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video' && videoContainerRef.current) {
          user.videoTrack?.play(videoContainerRef.current, { mirror: false, fit: 'contain' });
          setIsPlaying(true);
        }
        if (mediaType === 'audio' && !muteAudio) {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (_user, mediaType) => {
        if (mediaType === 'video') setIsPlaying(false);
      });

      client.on('user-left', () => setIsPlaying(false));

      await client.join(credentials.appId, credentials.channelName, credentials.token, credentials.uid);

      if (!unmountedRef.current) {
        setIsJoined(true);
        setReconnecting(false);
        retryCountRef.current = 0;
        console.log('✅ Conectado al canal Agora como espectador');
      }
    } catch (err) {
      console.error('❌ Error al unirse al canal:', err);
      if (unmountedRef.current) return;

      const msg = err instanceof Error ? err.message : 'Error de conexión al stream';
      setError(msg);
      onError?.(msg);
      scheduleReconnect();
    }
  }, [credentials, muteAudio, cleanup, scheduleReconnect, onError]);

  // ── Manual retry (after giving up) ────────────────────────────────────────
  const handleManualRetry = useCallback(() => {
    retryCountRef.current = 0;
    setGaveUp(false);
    setError(null);
    joinChannel();
  }, [joinChannel]);

  // ── Mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    unmountedRef.current = false;
    joinChannel();
    return () => {
      unmountedRef.current = true;
      cleanup();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video container */}
      <div
        ref={videoContainerRef}
        className="w-full h-full"
        style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '9/16', objectFit: 'contain' }}
      />

      {/* Waiting for broadcaster */}
      {!isPlaying && !error && !reconnecting && !gaveUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            {isJoined ? (
              <>
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Esperando al streamer...</p>
                <p className="text-sm text-gray-400 mt-2">El stream comenzará cuando el host esté listo</p>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p>Conectando al stream...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reconnecting overlay */}
      {reconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center text-white">
            <WifiOff className="h-10 w-10 mx-auto mb-3 text-yellow-400 animate-pulse" />
            <p className="font-semibold">Reconectando...</p>
            <p className="text-sm text-gray-300 mt-1">Intento {reconnectAttempt} de {MAX_RETRIES}</p>
            <div className="mt-3 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gave up / manual retry */}
      {gaveUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white max-w-md px-4">
            <WifiOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="font-semibold mb-2">No se pudo conectar al stream</p>
            <p className="text-sm text-gray-300 mb-4">
              Se intentó reconectar {MAX_RETRIES} veces sin éxito. Verifica tu conexión a internet.
            </p>
            <Button variant="secondary" onClick={handleManualRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Intentar de nuevo
            </Button>
          </div>
        </div>
      )}

      {/* Error overlay (non-reconnecting) */}
      {error && !reconnecting && !gaveUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white max-w-md px-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="font-semibold mb-2">Error de conexión</p>
            <p className="text-sm text-gray-300">{error}</p>
            <Button variant="secondary" className="mt-4 gap-2" onClick={handleManualRetry}>
              <RefreshCw className="h-4 w-4" /> Reintentar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
