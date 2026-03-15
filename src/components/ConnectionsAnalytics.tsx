/**
 * Connections Analytics Component
 * Real-time tracking of active connections
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Globe, MapPin, Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface ConnectionSummary {
  total: number;
  authenticated: number;
  anonymous: number;
}

interface CountryData {
  country: string;
  count: number;
}

interface CityData {
  city: string;
  country: string;
  count: number;
}

interface RecentConnection {
  id: number;
  socketId: string;
  userId: number | null;
  username: string | null;
  displayName: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: string | null;
  longitude: string | null;
  connectedAt: string;
  lastSeenAt: string;
}

interface AnalyticsData {
  summary: ConnectionSummary;
  byCountry: CountryData[];
  byCity: CityData[];
  recentConnections: RecentConnection[];
}

export default function ConnectionsAnalytics() {
  const { user, getIdToken } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      // Get fresh token using getIdToken from auth context
      const authToken = await getIdToken();
      
      if (!authToken) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/analytics/connections', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();

      // Refresh every 10 seconds
      const interval = setInterval(fetchAnalytics, 10000);

      return () => clearInterval(interval);
    } else {
      setError('Authentication required');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total}</div>
            <p className="text-xs text-muted-foreground">Active right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authenticated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.authenticated}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.total > 0
                ? Math.round((data.summary.authenticated / data.summary.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.anonymous}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.total > 0
                ? Math.round((data.summary.anonymous / data.summary.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Country */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
            <CardDescription>Connections by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byCountry.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                data.byCountry.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{item.country}</span>
                    </div>
                    <Badge>{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* By City */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Cities
            </CardTitle>
            <CardDescription>Connections by city</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byCity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                data.byCity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">
                        {item.city}, {item.country}
                      </span>
                    </div>
                    <Badge>{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Connections</CardTitle>
          <CardDescription>Last 50 active connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No connections yet</p>
            ) : (
              data.recentConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {conn.userId ? (
                        <>
                          <Badge variant="default">User</Badge>
                          <span className="text-sm font-medium">
                            {conn.displayName || conn.username}
                          </span>
                        </>
                      ) : (
                        <Badge variant="secondary">Anonymous</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {conn.city && conn.country && (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>
                            {conn.city}, {conn.country}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>
                      Connected: {new Date(conn.connectedAt).toLocaleTimeString()}
                    </div>
                    <div>
                      Last seen: {new Date(conn.lastSeenAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
