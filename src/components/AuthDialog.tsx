/**
 * Authentication Dialog
 * Login and Register forms in a modal dialog
 */

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getReferralCode, clearReferralCode } from '@/lib/useReferralTracking';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');

  // Load referral code from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      const storedRef = getReferralCode();
      if (storedRef) {
        setReferralCode(storedRef);
        console.log('📎 Referral code loaded from storage:', storedRef);
      }
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check if account is locked out
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setError(`Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`);
      setLoading(false);
      return;
    }

    if (!auth) {
      setError('Firebase authentication is not configured');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast.success('Welcome back!');
      setLoginAttempts(0); // Reset attempts on successful login
      setLockoutUntil(null);
      onOpenChange(false);
      // Reset form
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      console.error('Login error:', err);
      // Track failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + (15 * 60 * 1000); // 15 minutes
        setLockoutUntil(lockoutTime);
        setError('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        // User-friendly error messages
        if (err.code === 'auth/invalid-credential') {
          setError(`Invalid email or password. ${5 - newAttempts} attempts remaining.`);
        } else if (err.code === 'auth/user-not-found') {
          setError('No account found with this email.');
        } else if (err.code === 'auth/wrong-password') {
          setError(`Incorrect password. ${5 - newAttempts} attempts remaining.`);
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError('Failed to login. Please check your credentials.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!auth) {
      setError('Firebase authentication is not configured');
      setLoading(false);
      return;
    }

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );

      // Get Firebase token
      const token = await userCredential.user.getIdToken();

      // Register user in our backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: token,
          email: registerEmail,
          username: registerUsername,
          displayName: registerDisplayName,
          referredBy: referralCode, // Include referral code
        }),
      });

      const rawResponse = await response.text();
      let data: any = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch (parseError) {
        console.error('Register response JSON parse error:', {
          status: response.status,
          statusText: response.statusText,
          rawResponse,
          parseError,
        });
      }

      if (!response.ok) {
        throw new Error(data.message || `Registration failed (${response.status})`);
      }

      if (data.success) {
        // Clear referral code from localStorage after successful registration
        clearReferralCode();

        toast.success('Account created successfully! Logging you in...');
        
        // Close dialog immediately
        onOpenChange(false);
        
        // Reset form
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterUsername('');
        setRegisterDisplayName('');
        setReferralCode(null);
      } else {
        setError(data.message || 'Failed to register');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to LiveStream</DialogTitle>
          <DialogDescription>Login or create an account to start streaming</DialogDescription>
        </DialogHeader>

        {!isFirebaseConfigured && (
          <div className="bg-yellow-500 border border-yellow-600 text-black px-4 py-3 rounded-md text-sm font-medium">
            <strong>⚠️ Firebase Not Configured</strong>
            <p className="mt-1">
              Authentication is not available. Please configure Firebase credentials to enable login.
            </p>
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              {referralCode && (
                <div className="bg-green-500/10 border border-green-500 text-green-600 px-3 py-2 rounded text-sm">
                  🎉 Referred by: <strong>{referralCode}</strong>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder="coolstreamer"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-displayname">Display Name</Label>
                <Input
                  id="register-displayname"
                  type="text"
                  value={registerDisplayName}
                  onChange={(e) => setRegisterDisplayName(e.target.value)}
                  placeholder="Cool Streamer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
