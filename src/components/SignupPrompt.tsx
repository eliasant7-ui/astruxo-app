/**
 * Signup Prompt Component
 * Gentle prompt to encourage visitors to create an account
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Radio, MessageCircle } from 'lucide-react';

interface SignupPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignup: () => void;
  onContinue?: () => void;
  trigger?: 'posts' | 'profile' | 'stream' | 'comments';
  canContinue?: boolean;
}

export default function SignupPrompt({ 
  open, 
  onOpenChange, 
  onSignup,
  onContinue,
  trigger = 'posts',
  canContinue = false
}: SignupPromptProps) {
  const messages = {
    posts: {
      title: '¡Descubre más contenido!',
      description: 'Has visto los primeros posts. Crea una cuenta gratuita para seguir explorando.',
      icon: Users,
    },
    profile: {
      title: '¡Conoce a la comunidad!',
      description: 'Crea una cuenta para ver perfiles de usuarios y conectar con otros.',
      icon: Users,
    },
    stream: {
      title: '¡Mira transmisiones en vivo!',
      description: 'Regístrate gratis para ver streams en vivo y chatear con broadcasters.',
      icon: Radio,
    },
    comments: {
      title: '¡Únete a la conversación!',
      description: 'Crea una cuenta para leer comentarios y participar en las discusiones.',
      icon: MessageCircle,
    },
  };

  const message = messages[trigger];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* Logo de astruXo */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img 
              src="/logo.png" 
              alt="astruXo" 
              className="h-full w-full object-contain"
            />
          </div>
          <DialogTitle className="text-center text-2xl">
            {message.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-semibold">Con una cuenta gratuita puedes:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Ver contenido ilimitado
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Seguir a tus creadores favoritos
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Comentar y dar likes
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Ver transmisiones en vivo
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Crear tu propio contenido
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={onSignup}
              size="lg"
              className="w-full"
            >
              Crear cuenta gratis
            </Button>
            
            {/* Continue Exploring Button - Only for posts trigger and if allowed */}
            {trigger === 'posts' && canContinue && onContinue && (
              <Button 
                onClick={() => {
                  onContinue();
                  onOpenChange(false);
                }}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Continuar explorando
              </Button>
            )}
            
            {/* Close button for non-posts triggers */}
            {trigger !== 'posts' && (
              <Button 
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="lg"
                className="w-full"
              >
                Cerrar
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSignup}
              className="font-semibold text-primary hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
