/**
 * Referral Statistics Component
 * Shows referral codes and how many users registered with each
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp } from 'lucide-react';

interface ReferralStat {
  referredBy: string;
  count: number;
}

export default function ReferralStats() {
  const [stats, setStats] = useState<ReferralStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReferred, setTotalReferred] = useState(0);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) return;

      const response = await fetch('/api/admin/referral-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setTotalReferred(data.totalReferred);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Statistics
        </CardTitle>
        <CardDescription>
          Track which users are bringing new members to the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6 text-green-500" />
            {totalReferred} Total Referred Users
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.length} unique referrers
          </p>
        </div>

        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No referrals yet</p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer Username</TableHead>
                  <TableHead className="text-right">Users Referred</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat, index) => (
                  <TableRow key={stat.referredBy}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge variant="default" className="bg-yellow-500">
                            🏆 Top
                          </Badge>
                        )}
                        {stat.referredBy}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{stat.count} users</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
