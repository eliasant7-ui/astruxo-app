/**
 * Gift Selector Component
 * Elegant bottom sheet for selecting and sending gifts during live streams
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heart,
  ThumbsUp,
  Star,
  Flame,
  Flower2,
  Trophy,
  Crown,
  Gem,
  Rocket,
  Gift,
  Sparkles,
  PartyPopper,
  Zap,
  Sparkle,
  Coins,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Gift {
  id: number;
  name: string;
  icon: string;
  coinPrice: number;
  animationType: string;
}

interface GiftSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: number;
  onGiftSent: (gift: Gift, message?: string, grantedAccess?: boolean) => void;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Heart,
  ThumbsUp,
  Star,
  Flame,
  Flower2,
  Trophy,
  Crown,
  Gem,
  Rocket,
  Gift,
  Sparkles,
  PartyPopper,
  Zap,
  Sparkle,
};

export default function GiftSelector({ open, onOpenChange, streamId, onGiftSent }: GiftSelectorProps) {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [message, setMessage] = useState('');
  const [coinBalance, setCoinBalance] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchBalance();
    }
  }, [open]);

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

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) return;

      const response = await fetch('/api/wallet/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCoinBalance(data.balance.coins);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) return;

    // Check if user can afford the gift
    if (coinBalance < selectedGift.coinPrice) {
      toast.error('Not enough coins! Buy more coins to send this gift.');
      localStorage.setItem('coinPurchaseReturnTo', `/stream/${streamId}`);
      onOpenChange(false);
      navigate('/buy-coins');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        toast.error('Please login to send gifts');
        return;
      }

      const response = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          giftId: selectedGift.id,
          streamId,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCoinBalance(data.transaction.newBalance);
        onGiftSent(selectedGift, message.trim() || undefined, data.grantedPrivateAccess);
        setSelectedGift(null);
        setMessage('');
        onOpenChange(false);
        
        // Show success message
        if (data.grantedPrivateAccess) {
          toast.success('Access granted! You can now watch the stream.');
        }
      } else {
        toast.error(data.message || 'Failed to send gift');
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error('Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  const getGiftIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Gift;
    return IconComponent;
  };

  const getTierColor = (price: number) => {
    if (price >= 1000) return 'text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]';
    if (price >= 100) return 'text-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]';
    if (price >= 25) return 'text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.9)]';
    if (price >= 10) return 'text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.9)]';
    return 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]';
  };

  const getTierBg = (price: number) => {
    if (price >= 1000) return 'bg-purple-500/10 hover:bg-purple-500/20';
    if (price >= 100) return 'bg-blue-500/10 hover:bg-blue-500/20';
    if (price >= 25) return 'bg-yellow-500/10 hover:bg-yellow-500/20';
    return 'bg-secondary hover:bg-secondary/80';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[30vh] rounded-t-3xl flex flex-col bg-black/40 backdrop-blur-xl border-t-2 border-white/20">
        <SheetHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg text-white">Send a Gift</SheetTitle>
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 border-yellow-500/30">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="font-semibold text-yellow-400">{coinBalance}</span>
            </Badge>
          </div>
        </SheetHeader>

        {/* Horizontal Scrollable Gift Grid - 6 visible at once */}
        <div className="flex-1 -mx-6 px-6 min-h-0 flex items-center">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide w-full">
            {gifts.map((gift) => {
              const IconComponent = getGiftIcon(gift.icon);
              const isSelected = selectedGift?.id === gift.id;
              const canAfford = coinBalance >= gift.coinPrice;

              return (
                <button
                  key={gift.id}
                  onClick={() => {
                    if (!canAfford) return;
                    
                    // If already selected, send the gift
                    if (isSelected) {
                      handleSendGift();
                    } else {
                      // Otherwise, select it
                      setSelectedGift(gift);
                    }
                  }}
                  disabled={!canAfford}
                  className={`
                    relative flex-shrink-0 w-32 h-44 rounded-2xl border-2 transition-all duration-200 snap-center
                    flex flex-col items-center justify-center gap-2 p-3
                    ${isSelected ? 'border-primary bg-gradient-to-br from-primary/30 to-accent/30 shadow-lg scale-105' : 'border-white/20 bg-white/5'}
                    ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:scale-105 active:scale-95'}
                  `}
                >
                  <IconComponent className={`h-14 w-14 ${getTierColor(gift.coinPrice)}`} />
                  <span className="text-sm font-medium text-center text-white px-1 line-clamp-2">{gift.name}</span>
                  
                  {/* Price Badge */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                    <Coins className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">{gift.coinPrice}</span>
                  </div>
                  
                  {/* Show SEND text when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-2xl">
                      <span className="text-white font-bold text-lg">SEND</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Area - Buy Coins if needed */}
        {coinBalance === 0 && (
          <div className="pt-3 border-t border-white/10 flex-shrink-0">
            <Button
              onClick={() => {
                localStorage.setItem('coinPurchaseReturnTo', `/stream/${streamId}`);
                onOpenChange(false);
                navigate('/buy-coins');
              }}
              size="lg"
              className="w-full h-10 text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Coins className="h-4 w-4 mr-2" />
              Buy Coins
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
