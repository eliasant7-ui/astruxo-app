import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Video, LogOut, User, DollarSign, Settings, MoreVertical, FileText, Shield, Lock, Info, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import { toast } from 'sonner';
import AuthDialog from '@/components/AuthDialog';
import LanguageSelector from '@/components/LanguageSelector';
import UserSearchDialog from '@/components/UserSearchDialog';

export default function Header() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/streams', label: 'Streams' },
  ];

  const handleLogout = async () => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }
    
    if (!auth) return;
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className="sticky z-50 glass-header top-0">
        <div className="container mx-auto px-4">
          <div className="flex h-14 md:h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 md:gap-3">
              <img src="/logo.png" alt="astruXo" className="h-8 md:h-10 w-auto object-contain" />
              <span className="text-lg md:text-xl font-bold text-foreground">astruXo</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                    location.pathname === item.href 
                      ? 'text-foreground bg-primary/10 font-semibold' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {!isFirebaseConfigured ? (
                <Button variant="outline" size="sm" disabled>Auth Not Configured</Button>
              ) : loading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/user/${user.uid}`}><User className="h-4 w-4 mr-2" /> Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile/edit"><Settings className="h-4 w-4 mr-2" /> Edit Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/earnings"><DollarSign className="h-4 w-4 mr-2" /> Earnings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/settings"><Settings className="h-4 w-4 mr-2" /> Account Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Search button with LIVE badge */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-md h-10 w-10 border border-border/50"
                    onClick={() => setSearchDialogOpen(true)}
                    title="Buscar usuarios"
                  >
                    <div className="flex items-center gap-1">
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 bg-red-600 text-white font-bold border-4 border-yellow-400 shadow-lg">                        LIVE
                      </Badge>
                      <Search className="h-5 w-5" />
                    </div>
                  </Button>

                  <LanguageSelector />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 border border-border/50"><MoreVertical className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Info</DropdownMenuLabel>
                      <DropdownMenuItem asChild><Link to="/about">About Us</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => setAuthDialogOpen(true)}>
                  Login
                </Button>
              )}
            </nav>

            <div className="md:hidden flex items-center gap-2">
              {/* LIVE button - links to streams */}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md h-9 px-2"
                asChild
              >
                <Link to="/streams">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center justify-center w-5 h-5 border border-foreground rounded-sm">
                      <span className="text-[5px] font-bold text-foreground leading-none">LIVE</span>
                    </div>
                  </div>
                </Link>
              </Button>
              
              {/* Search button */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md h-9 w-9"
                onClick={() => setSearchDialogOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-accent rounded-md"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                {!isFirebaseConfigured ? (
                  <Button variant="outline" size="sm" disabled>Auth Not Configured</Button>
                ) : loading ? (
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                ) : user ? (
                  <>
                    <Link
                      to={`/user/${user.uid}`}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/earnings"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Earnings
                    </Link>
                    <Link
                      to="/account/settings"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-destructive"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setAuthDialogOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                )}
                
                <div className="pt-2 border-t border-border">
                  <LanguageSelector />
                </div>
              </nav>
            </div>
          )}
        </div>

        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        <UserSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
      </header>
    </>
  );
}