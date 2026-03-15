/**
 * Broadcaster View Component
 * Agora video integration for host with automatic reconnection.
 *
 * Reconnection strategy:
 *  - On DISCONNECTED state → exponential backoff (1s, 2s, 4s … max 30s)
 *  - Re-publishes audio/video tracks after reconnect
 *  - Max 6 attempts (broadcaster needs to know quickly if connection is lost)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { AlertCircle, SwitchCamera, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface BroadcasterViewProps {
  credentials: {
    appId: string;
    channelName: string;
    token: string;
    uid: number;
  };
  onError?: (error: string) => void;
  isMuted?: boolean;
  cameraFacing?: 'user' | 'environment';
  shouldStart?: boolean; // Control when to start streaming
}

const MAX_RETRIES = 6;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

export default function BroadcasterView({ 
  credentials, 
  onError,
  isMuted = false,
  cameraFacing = 'user',
  shouldStart = false
}: BroadcasterViewProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    getAvailableCameras();
    if (shouldStart) joinChannel();
    return () => {
      unmountedRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      leaveChannel();
    };
  }, [shouldStart]);

  // Handle microphone mute/unmute
  useEffect(() => {
    const handleMute = async () => {
      if (audioTrackRef.current) {
        try {
          if (isMuted) {
            await audioTrackRef.current.setEnabled(false);
            console.log('🔇 Microphone muted');
          } else {
            await audioTrackRef.current.setEnabled(true);
            console.log('🎤 Microphone unmuted');
          }
        } catch (error) {
          console.error('Error toggling microphone:', error);
        }
      }
    };

    handleMute();
  }, [isMuted]);

  // Handle camera flip
  useEffect(() => {
    if (cameraFacing !== currentFacingMode && videoTrackRef.current) {
      switchCamera();
    }
  }, [cameraFacing]);

  // Get list of available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await AgoraRTC.getCameras();
      setAvailableCameras(devices);
    } catch (err) {
      console.error('Error getting cameras:', err);
    }
  };

  // ── Cleanup Agora resources ────────────────────────────────────────────────
  const cleanupAgora = useCallback(async () => {
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    if (audioTrackRef.current) { audioTrackRef.current.stop(); audioTrackRef.current.close(); audioTrackRef.current = null; }
    if (videoTrackRef.current) { videoTrackRef.current.stop(); videoTrackRef.current.close(); videoTrackRef.current = null; }
    if (clientRef.current) {
      try { clientRef.current.removeAllListeners(); await clientRef.current.leave(); } catch { /* ignore */ }
      clientRef.current = null;
    }
  }, []);

  // ── Exponential backoff reconnect ──────────────────────────────────────────
  const scheduleReconnect = useCallback(() => {
    if (unmountedRef.current) return;
    const attempt = retryCountRef.current + 1;
    if (attempt > MAX_RETRIES) {
      setGaveUp(true);
      setReconnecting(false);
      toast.error('Se perdió la conexión al stream. Verifica tu internet.');
      return;
    }
    retryCountRef.current = attempt;
    setReconnectAttempt(attempt);
    setReconnecting(true);
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
    console.log(`🔄 Broadcaster reconectando en ${delay}ms (intento ${attempt}/${MAX_RETRIES})`);
    toast.warning(`Reconectando... intento ${attempt}`);
    retryTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) joinChannel();
    }, delay);
  }, []);

  const joinChannel = async () => {
    if (unmountedRef.current) return;
    await cleanupAgora();

    try {
      setError(null);
      setGaveUp(false);

      console.log('🎥 Creando cliente Agora...');
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8', role: 'host' });
      client.enableDualStream();
      clientRef.current = client;

      // ── Connection state → auto-reconnect ─────────────────────────────────
      client.on('connection-state-change', (curState, prevState) => {
        console.log(`📡 Broadcaster Agora: ${prevState} → ${curState}`);
        if (curState === 'DISCONNECTED' && !unmountedRef.current) {
          setIsPublishing(false);
          scheduleReconnect();
        }
        if (curState === 'CONNECTED') {
          retryCountRef.current = 0;
          setReconnecting(false);
          setReconnectAttempt(0);
        }
      });

      await client.setClientRole('host');

      console.log('🎥 Uniéndose al canal:', credentials.channelName);
      await client.join(credentials.appId, credentials.channelName, credentials.token, credentials.uid);
      console.log('✅ Unido al canal Agora');

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: 'music_standard', AEC: true, ANS: true, AGC: true },
        {
          encoderConfig: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: 30,
            bitrateMin: 800,
            bitrateMax: 1500,
          },
          optimizationMode: 'detail',
        }
      );

      audioTrackRef.current = audioTrack;
      videoTrackRef.current = videoTrack;

      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current, { mirror: false });
      }

      await client.publish([audioTrack, videoTrack]);

      if (!unmountedRef.current) {
        setIsPublishing(true);
        setReconnecting(false);
        retryCountRef.current = 0;
        console.log('✅ Publicando en Agora');
        if (reconnectAttempt > 0) toast.success('¡Reconectado al stream!');
      }
    } catch (err) {
      console.error('❌ Error al iniciar broadcast:', err);
      if (unmountedRef.current) return;

      let errorMsg = 'Error al iniciar el video';
      if (err instanceof Error) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          errorMsg = 'Acceso a cámara/micrófono denegado. Permite los permisos e intenta de nuevo.';
        } else if (err.message.includes('NotFoundError')) {
          errorMsg = 'No se encontró cámara o micrófono. Conecta un dispositivo e intenta de nuevo.';
        } else if (err.message.includes('NotReadableError')) {
          errorMsg = 'La cámara está siendo usada por otra aplicación.';
        } else if (err.message.includes('INVALID_PARAMS')) {
          errorMsg = 'Parámetros de stream inválidos. Intenta crear un nuevo stream.';
        } else {
          errorMsg = err.message;
        }
      }

      setError(errorMsg);
      onError?.(errorMsg);
      // Only auto-reconnect for network errors, not permission errors
      if (!errorMsg.includes('denegado') && !errorMsg.includes('cámara') && !errorMsg.includes('micrófono')) {
        scheduleReconnect();
      }
    }
  };

  const leaveChannel = async () => {
    await cleanupAgora();
    setIsPublishing(false);
    console.log('✅ Salió del canal Agora');
  };

  // Switch between front and rear cameras
  const switchCamera = async () => {
    if (!videoTrackRef.current || !clientRef.current || isSwitchingCamera) {
      return;
    }

    try {
      setIsSwitchingCamera(true);
      console.log('🔄 Switching camera...');

      // Determine next camera
      const nextFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      // Get available cameras
      const cameras = await AgoraRTC.getCameras();
      
      if (cameras.length < 2) {
        toast.error('No additional cameras available');
        setIsSwitchingCamera(false);
        return;
      }

      // Find camera with desired facing mode
      let targetCamera = cameras.find((camera) => {
        const label = camera.label.toLowerCase();
        if (nextFacingMode === 'environment') {
          return label.includes('back') || label.includes('rear') || label.includes('environment');
        } else {
          return label.includes('front') || label.includes('user') || label.includes('face');
        }
      });

      // If no camera found with label, just use the next camera in the list
      if (!targetCamera) {
        const currentIndex = cameras.findIndex(
          (cam) => cam.deviceId === videoTrackRef.current?.getTrackId()
        );
        const nextIndex = (currentIndex + 1) % cameras.length;
        targetCamera = cameras[nextIndex];
      }

      if (!targetCamera) {
        toast.error('Could not find another camera');
        setIsSwitchingCamera(false);
        return;
      }

      console.log('📷 Switching to camera:', targetCamera.label);

      // Unpublish current video track
      await clientRef.current.unpublish(videoTrackRef.current);

      // Stop and close current video track
      videoTrackRef.current.stop();
      videoTrackRef.current.close();

      // Create new video track with the target camera
      const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: targetCamera.deviceId,
        encoderConfig: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: 30,
          bitrateMin: 800,
          bitrateMax: 1500,
        },
        optimizationMode: 'detail',
      });

      // Update ref
      videoTrackRef.current = newVideoTrack;

      // Play new video track locally WITHOUT mirror effect
      if (videoContainerRef.current) {
        newVideoTrack.play(videoContainerRef.current, { mirror: false });
      }

      // Publish new video track
      await clientRef.current.publish(newVideoTrack);

      // Update facing mode
      setCurrentFacingMode(nextFacingMode);

      console.log('✅ Camera switched successfully');
      toast.success(`Switched to ${nextFacingMode === 'user' ? 'front' : 'rear'} camera`);
    } catch (err) {
      console.error('❌ Error switching camera:', err);
      toast.error('Failed to switch camera');
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video container */}
      <div
        ref={videoContainerRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Loading overlay */}
      {!isPublishing && !error && !reconnecting && !gaveUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Conectando al stream...</p>
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

      {/* Error overlay */}
      {(error || gaveUp) && !reconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white max-w-md px-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="font-semibold mb-2">Error de conexión</p>
            <p className="text-sm text-gray-300 mb-4">{error || 'Se perdió la conexión al stream.'}</p>
            <Button variant="secondary" className="gap-2" onClick={() => {
              retryCountRef.current = 0;
              setGaveUp(false);
              setError(null);
              joinChannel();
            }}>
              <RefreshCw className="h-4 w-4" /> Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Camera switch button — only show when publishing */}
      {isPublishing && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 rounded-full opacity-80 hover:opacity-100"
          onClick={switchCamera}
          disabled={isSwitchingCamera}
          title="Cambiar cámara"
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>
      )}

    </div>
  );
}
