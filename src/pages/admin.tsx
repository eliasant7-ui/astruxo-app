/**
 * Admin Dashboard Page
 * Manage users, posts, reports, and moderation logs
 * Admin only
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EnhancedAnalyticsDashboard from '@/components/EnhancedAnalyticsDashboard';
import AdminVisitorStats from '@/components/AdminVisitorStats';
import ReferralStats from '@/components/ReferralStats';
import BootstrapControlPanel from '@/components/BootstrapControlPanel';
import SystemStreamsPanel from '@/components/SystemStreamsPanel';
import SystemHealthDashboard from '@/components/SystemHealthDashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  FileText,
  History,
  Search,
  Ban,
  UserX,
  Trash2,
  Eye,
  BarChart3,
  TrendingUp,
  Bot,
  Radio,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { user, getIdToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  const [token, setToken] = useState<string>('');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);

  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [postsSearch, setPostsSearch] = useState('');
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsPage, setLogsPage] = useState(1);



  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: string;
    targetId: number;
    targetName: string;
  }>({
    open: false,
    type: '',
    targetId: 0,
    targetName: '',
  });

  // Check if user is admin
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // ProtectedRoute already handles !user case, so we can skip this check
    if (!user) {
      return;
    }

    // Check role from auth context
    const checkAdmin = async () => {
      try {
        const authToken = await getIdToken();
        if (authToken) {
          setToken(authToken);
        }
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (data.user.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Failed to verify admin access');
        navigate('/');
      }
    };

    checkAdmin();
  }, [user, navigate, getIdToken, authLoading]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = await getIdToken();
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: '20',
      });

      if (usersSearch) {
        params.append('search', usersSearch);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setUsersTotal(0);
      toast.error('Failed to fetch users');
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const token = await getIdToken();
      const params = new URLSearchParams({
        page: postsPage.toString(),
        limit: '20',
      });

      if (postsSearch) {
        params.append('search', postsSearch);
      }

      const response = await fetch(`/api/admin/posts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setPostsTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      setPostsTotal(0);
      toast.error('Failed to fetch posts');
    }
  };



  // Fetch logs
  const fetchLogs = async () => {
    try {
      const token = await getIdToken();
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: '50',
      });

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
      toast.error('Failed to fetch logs');
    }
  };

  // Perform admin action
  const performAction = async (actionType: string, targetUserId?: number, targetPostId?: number) => {
    try {
      const token = await getIdToken();
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actionType,
          targetUserId,
          targetPostId,
          reason: 'Admin action from dashboard',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // Refresh data
        if (actionType.includes('user')) {
          fetchUsers();
        } else if (actionType.includes('post')) {
          fetchPosts();
        }
        fetchLogs();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (loading) return;

    switch (activeTab) {
      case 'users':
        fetchUsers();
        break;
      case 'posts':
        fetchPosts();
        break;
      case 'logs':
        fetchLogs();
        break;
    }
  }, [activeTab, loading, usersPage, usersSearch, postsPage, postsSearch, logsPage]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <title>Admin Dashboard - LiveStream Platform</title>
      <meta name="description" content="Admin dashboard for managing users, posts, and reports" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage users, content, and moderation</p>
        </div>

        {/* Visitor Statistics */}
        <AdminVisitorStats />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="health">
              <BarChart3 className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts">
              <FileText className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="streams">
              <Radio className="h-4 w-4 mr-2" />
              24/7 Streams
            </TabsTrigger>
            <TabsTrigger value="bootstrap">
              <Bot className="h-4 w-4 mr-2" />
              Bootstrap
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <TrendingUp className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <SystemHealthDashboard />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {u.displayName?.charAt(0) || u.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{u.displayName || u.username}</p>
                                <p className="text-sm text-muted-foreground">@{u.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.isBanned ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : u.isSuspended ? (
                              <Badge variant="outline">Suspended</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {u.role !== 'admin' && (
                                <>
                                  {!u.isBanned && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        setActionDialog({
                                          open: true,
                                          type: 'ban_user',
                                          targetId: u.id,
                                          targetName: u.displayName || u.username,
                                        })
                                      }
                                    >
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {u.isBanned && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => performAction('unban_user', u.id)}
                                    >
                                      Unban
                                    </Button>
                                  )}
                                  {!u.isSuspended && !u.isBanned && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => performAction('suspend_user', u.id)}
                                    >
                                      <UserX className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {u.isSuspended && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => performAction('unsuspend_user', u.id)}
                                    >
                                      Unsuspend
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/user/${u.id}`)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {users.length} of {usersTotal} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPage === 1}
                      onClick={() => setUsersPage(usersPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPage * 20 >= usersTotal}
                      onClick={() => setUsersPage(usersPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Post Management</CardTitle>
                <CardDescription>View and manage all posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      value={postsSearch}
                      onChange={(e) => setPostsSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((p) => (
                        <TableRow key={p.post.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={p.user?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {p.user?.displayName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">@{p.user?.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-2 max-w-md">
                              {p.post.content || '(No text)'}
                            </p>
                          </TableCell>
                          <TableCell>
                            {p.post.mediaType ? (
                              <Badge variant="secondary">{p.post.mediaType}</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">Text</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>❤️ {p.post.likeCount}</p>
                              <p>💬 {p.post.commentCount}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(p.post.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/post/${p.post.id}`)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'delete_post',
                                    targetId: p.post.id,
                                    targetName: `post by @${p.user?.username}`,
                                  })
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {posts.length} of {postsTotal} posts
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={postsPage === 1}
                      onClick={() => setPostsPage(postsPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={postsPage * 20 >= postsTotal}
                      onClick={() => setPostsPage(postsPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Streams Tab */}
          <TabsContent value="streams" className="space-y-4">
            <SystemStreamsPanel />
          </TabsContent>

          {/* Bootstrap Tab */}
          <TabsContent value="bootstrap" className="space-y-4">
            <BootstrapControlPanel token={token} />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4">
            <ReferralStats />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Moderation Logs</CardTitle>
                <CardDescription>View all admin actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((l) => (
                        <TableRow key={l.log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={l.admin?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {l.admin?.displayName?.charAt(0) || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">@{l.admin?.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{l.log.actionType}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {l.log.targetUserId && `User ID ${l.log.targetUserId}`}
                            {l.log.targetPostId && `Post ID ${l.log.targetPostId}`}
                            {l.log.targetStreamId && `Stream ID ${l.log.targetStreamId}`}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {l.log.reason || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDistanceToNow(new Date(l.log.createdAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage(logsPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogsPage(logsPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.type.replace('_', ' ')} {actionDialog.targetName}?
              This action will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionDialog.type.includes('user')) {
                  performAction(actionDialog.type, actionDialog.targetId);
                } else if (actionDialog.type.includes('post')) {
                  performAction(actionDialog.type, undefined, actionDialog.targetId);
                }
                setActionDialog({ open: false, type: '', targetId: 0, targetName: '' });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
