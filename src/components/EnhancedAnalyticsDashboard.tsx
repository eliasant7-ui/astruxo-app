/**
 * Enhanced Analytics Dashboard Component
 * Comprehensive analytics with traffic, behavior, and retention metrics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Clock, 
  MessageSquare,
  Video,
  Heart,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalStreams: number;
  totalComments: number;
  totalLikes: number;
  traffic: {
    usersOnlineNow: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    newUsersToday: number;
    sessionsToday: number;
    countryBreakdown: Array<{ country: string; count: number }>;
    deviceBreakdown: Array<{ deviceType: string; count: number }>;
  };
  behavior: {
    avgSessionDuration: number;
    postCreationRate: number;
    commentRate: number;
    streamRate: number;
    pwaInstallCount: number;
  };
  retention: {
    returningUsersRate: number;
    day1RetentionRate: number;
  };
  growth: {
    dailyGrowth: Array<{ date: string; newUsers: number }>;
  };
}

interface EnhancedAnalyticsDashboardProps {
  token: string;
}

export default function EnhancedAnalyticsDashboard({ token }: EnhancedAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics(true); // Initial load

    // Auto-refresh every 10 seconds for real-time data
    const interval = setInterval(() => {
      fetchAnalytics(false); // Background refresh
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const fetchAnalytics = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const response = await fetch('/api/admin/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (isInitialLoad) {
        toast.error('Failed to load analytics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const seedAnalytics = async () => {
    try {
      console.log('🌱 Starting seed analytics...');
      setSeeding(true);
      
      console.log('📤 Sending POST to /api/admin/seed-analytics');
      const response = await fetch('/api/admin/seed-analytics', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Seed failed:', errorData);
        throw new Error(errorData.error || 'Failed to seed analytics');
      }

      const result = await response.json();
      console.log('✅ Seed successful:', result);
      toast.success(`Created ${result.stats.sessionsCreated} sessions and ${result.stats.pwaInstallsCreated} PWA installs`);
      
      // Refresh analytics
      console.log('🔄 Refreshing analytics...');
      await fetchAnalytics(false);
    } catch (error) {
      console.error('❌ Error seeding analytics:', error);
      toast.error(`Failed to seed analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  const clearAnalytics = async () => {
    if (!confirm('⚠️ This will DELETE ALL analytics data (sessions, connections). This will remove all fake/seed data. Are you sure?')) {
      return;
    }

    try {
      console.log('🧹 Clearing analytics data...');
      setSeeding(true);
      
      const response = await fetch('/api/admin/clear-analytics', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to clear analytics');
      }

      const result = await response.json();
      console.log('✅ Clear successful:', result);
      toast.success('All analytics data cleared! Now showing only real user data.');
      
      // Refresh analytics
      await fetchAnalytics(true);
    } catch (error) {
      console.error('❌ Clear error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear analytics');
    } finally {
      setSeeding(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-muted-foreground">No analytics data available yet.</p>
          <p className="text-sm text-muted-foreground">
            Analytics data is collected from user sessions and PWA installations. 
            You can generate sample data for testing.
          </p>
          <button
            onClick={seedAnalytics}
            disabled={seeding}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {seeding ? 'Generating...' : 'Generate Sample Data'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH LAST UPDATED */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">Real-time platform metrics • Auto-refreshes every 10s</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={clearAnalytics}
            disabled={seeding}
            variant="destructive"
            size="sm"
          >
            {seeding ? 'Clearing...' : 'Clear All Data'}
          </Button>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* OVERVIEW SECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeUsers} active (30d)
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalComments} comments
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalStreams.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All-time broadcasts</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLikes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total likes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TRAFFIC SECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Traffic</h3>
        
        {/* REAL-TIME USERS - DESTACADO */}
        <Card className="glass-card mb-4 border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="relative">
                <Users className="h-5 w-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              Usuarios Conectados Ahora
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" style={{ animationDuration: '3s' }} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{analytics.traffic.usersOnlineNow}</div>
            <p className="text-sm text-muted-foreground mt-1">
              En línea en los últimos 5 minutos
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.traffic.dailyActiveUsers}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.traffic.weeklyActiveUsers}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.traffic.newUsersToday}</div>
              <p className="text-xs text-muted-foreground">Signups today</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.traffic.sessionsToday}</div>
              <p className="text-xs text-muted-foreground">Active sessions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Country Breakdown */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Countries
              </CardTitle>
              <CardDescription>Geographic distribution of users</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.traffic.countryBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {analytics.traffic.countryBreakdown.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{country.country}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(country.count / analytics.traffic.countryBreakdown[0].count) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{country.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Types
              </CardTitle>
              <CardDescription>Platform distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.traffic.deviceBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {analytics.traffic.deviceBreakdown.map((device, index) => {
                    const total = analytics.traffic.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                    const percentage = total > 0 ? ((device.count / total) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{device.deviceType}</span>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BEHAVIOR SECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-4">User Behavior</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(analytics.behavior.avgSessionDuration)}</div>
              <p className="text-xs text-muted-foreground">Average duration</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Post Creators</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.behavior.postCreationRate}%</div>
              <p className="text-xs text-muted-foreground">Users who post</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commenters</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.behavior.commentRate}%</div>
              <p className="text-xs text-muted-foreground">Users who comment</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streamers</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.behavior.streamRate}%</div>
              <p className="text-xs text-muted-foreground">Users who stream</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PWA Installs</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.behavior.pwaInstallCount}</div>
              <p className="text-xs text-muted-foreground">Total installations</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RETENTION SECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Retention</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Returning Users</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.retention.returningUsersRate}%</div>
              <p className="text-xs text-muted-foreground">Users with multiple sessions</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Day 1 Retention</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.retention.day1RetentionRate}%</div>
              <p className="text-xs text-muted-foreground">Users who return next day</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GROWTH CHART */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Growth (Last 30 Days)</h3>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Daily New Users</CardTitle>
            <CardDescription>User signups over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.growth.dailyGrowth.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-end gap-1 h-32">
                  {analytics.growth.dailyGrowth.map((day, index) => {
                    const maxUsers = Math.max(...analytics.growth.dailyGrowth.map(d => d.newUsers));
                    const height = maxUsers > 0 ? (day.newUsers / maxUsers) * 100 : 0;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-primary rounded-t hover:bg-primary/80 transition-colors cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.newUsers} new users`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No growth data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
