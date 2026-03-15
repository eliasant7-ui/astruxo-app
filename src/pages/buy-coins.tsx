/**
 * Buy Coins Page
 * Purchase virtual coins for sending gifts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  popular?: boolean;
  icon: any;
  color: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: '100',
    coins: 100,
    price: 0.99,
    bonus: 0,
    icon: Coins,
    color: 'from-gray-500 to-gray-600',
  },
  {
    id: '500',
    coins: 500,
    price: 4.99,
    bonus: 50,
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: '1000',
    coins: 1000,
    price: 9.99,
    bonus: 150,
    popular: true,
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: '2500',
    coins: 2500,
    price: 24.99,
    bonus: 500,
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: '5000',
    coins: 5000,
    price: 49.99,
    bonus: 1500,
    icon: Crown,
    color: 'from-purple-600 to-pink-600',
  },
];

export default function BuyCoinsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (authLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }
    fetchBalance();

    // Check for success/cancel from Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const returnTo = localStorage.getItem('coinPurchaseReturnTo');

    if (success === 'true') {
      toast.success('Payment successful! Your coins have been added to your account.');
      
      // Redirect back to stream if there's a return URL
      if (returnTo) {
        localStorage.removeItem('coinPurchaseReturnTo');
        navigate(returnTo, { replace: true });
      } else {
        // Remove query params
        navigate('/buy-coins', { replace: true });
      }
    } else if (canceled === 'true') {
      toast.error('Payment canceled. No charges were made.');
      
      // Redirect back to stream if there's a return URL
      if (returnTo) {
        localStorage.removeItem('coinPurchaseReturnTo');
        navigate(returnTo, { replace: true });
      } else {
        // Remove query params
        navigate('/buy-coins', { replace: true });
      }
    }
  }, [user, authLoading, searchParams]);

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
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CoinPackage) => {
    if (!user) {
      toast.error('Please login to purchase coins');
      return;
    }

    setPurchasing(pkg.id);

    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        toast.error('Please login to continue');
        setPurchasing(null);
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: pkg.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error(data.message || 'Failed to create checkout session');
        setPurchasing(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to start purchase process');
      setPurchasing(null);
    }
  };

  return (
    <>
      <title>Buy Coins - astruXo</title>
      <meta name="description" content="Purchase coins to send gifts to your favorite streamers" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Buy Coins</h1>
            <p className="text-muted-foreground mb-4">
              Support your favorite streamers by sending gifts
            </p>
            {!loading && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Coins className="h-5 w-5 mr-2" />
                Current Balance: {coinBalance} coins
              </Badge>
            )}
          </div>

          {/* Coin Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {COIN_PACKAGES.map((pkg) => {
              const IconComponent = pkg.icon;
              const totalCoins = pkg.coins + pkg.bonus;

              return (
                <Card
                  key={pkg.id}
                  className={`relative overflow-hidden ${pkg.popular ? 'border-primary border-2' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                      MOST POPULAR
                    </div>
                  )}

                  <CardHeader>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{pkg.coins} Coins</CardTitle>
                    {pkg.bonus > 0 && (
                      <Badge variant="secondary" className="w-fit">
                        +{pkg.bonus} Bonus
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <p className="text-4xl font-bold mb-2">${pkg.price}</p>
                      {pkg.bonus > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Total: {totalCoins} coins
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handlePurchase(pkg)}
                      className="w-full"
                      variant={pkg.popular ? 'default' : 'outline'}
                      disabled={purchasing !== null}
                    >
                      {purchasing === pkg.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Purchase'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Why Buy Coins?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Support Creators</h3>
                    <p className="text-sm text-muted-foreground">
                      Help your favorite streamers earn money while they entertain you
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Stand Out</h3>
                    <p className="text-sm text-muted-foreground">
                      Get noticed with animated gift effects during live streams
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Bonus Coins</h3>
                    <p className="text-sm text-muted-foreground">
                      Get extra coins with larger packages - more value for your money
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Secure payment processing powered by Stripe</p>
            <p className="mt-2">
              By purchasing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
