/**
 * Earnings Dashboard
 * View earnings, gift history, and withdrawal options
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  Coins,
  Gift,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface GiftTransaction {
  id: number;
  giftName: string;
  giftIcon: string;
  coinAmount: number;
  message: string | null;
  senderUsername: string;
  senderDisplayName: string | null;
  senderAvatar: string | null;
  streamTitle: string;
  createdAt: string;
}

interface Earnings {
  walletBalance: number;
  coinBalance: number;
  totalCoinsReceived: number;
  totalGiftsReceived: number;
  recentGifts: GiftTransaction[];
}

export default function EarningsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/wallet/earnings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setEarnings(data.earnings);
        setError(null);
      } else {
        setError(data.message || 'Failed to load earnings');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading earnings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground">{error || 'Failed to load earnings'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <title>Earnings - LiveStream Platform</title>
      <meta name="description" content="View your earnings and gift history" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your income and gift history</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Wallet Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${earnings.walletBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
            </CardContent>
          </Card>

          {/* Coin Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coin Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earnings.coinBalance}</div>
              <p className="text-xs text-muted-foreground mt-1">Available to send gifts</p>
            </CardContent>
          </Card>

          {/* Total Coins Received */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earnings.totalCoinsReceived}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${(earnings.totalCoinsReceived * 0.01).toFixed(2)} value
              </p>
            </CardContent>
          </Card>

          {/* Total Gifts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gifts Received</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earnings.totalGiftsReceived}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Withdraw Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-bold">${earnings.walletBalance.toFixed(2)}</p>
              </div>
              <Button disabled={earnings.walletBalance < 10}>
                <Download className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
            {earnings.walletBalance < 10 && (
              <p className="text-sm text-muted-foreground mt-4">
                Minimum withdrawal amount is $10.00
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Gifts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Gifts</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.recentGifts.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Gifts Yet</h3>
                <p className="text-muted-foreground">
                  Start streaming to receive gifts from your viewers!
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {earnings.recentGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      {/* Sender Avatar */}
                      <Avatar>
                        <AvatarImage src={gift.senderAvatar || undefined} />
                        <AvatarFallback>
                          {gift.senderDisplayName?.[0] || gift.senderUsername[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Gift Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {gift.senderDisplayName || gift.senderUsername}
                          </p>
                          <span className="text-muted-foreground">sent</span>
                          <Badge variant="secondary">{gift.giftName}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          in {gift.streamTitle}
                        </p>
                        {gift.message && (
                          <p className="text-sm italic bg-muted p-2 rounded mt-2">
                            "{gift.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(gift.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Coin Amount */}
                      <div className="text-right">
                        <Badge className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {gift.coinAmount}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${(gift.coinAmount * 0.01).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
