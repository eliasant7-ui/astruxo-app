/**
 * Bootstrap Control Panel Component
 * Admin interface for managing automated content system
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bot, Activity, MessageSquare, Radio, CheckCircle2, XCircle } from 'lucide-react';

interface BootstrapConfig {
  id: number;
  isEnabled: boolean;
  autoPostingEnabled: boolean;
  autoCommentsEnabled: boolean;
  streamAnnouncementsEnabled: boolean;
  minPostIntervalMinutes: number;
  maxPostIntervalMinutes: number;
  commentProbability: string;
  maxCommentsPerPost: number;
}

interface BootstrapStats {
  bots: Array<{
    id: number;
    botType: string;
    isActive: boolean;
    postFrequencyMinutes: number;
    lastPostedAt: string | null;
    username: string;
    displayName: string;
  }>;
  recentActivity: Record<string, number>;
  totalActivity: Record<string, number>;
  successRate: {
    total: number;
    successful: number;
    percentage: string;
  };
}

export default function BootstrapControlPanel({ token }: { token: string }) {
  const [config, setConfig] = useState<BootstrapConfig | null>(null);
  const [stats, setStats] = useState<BootstrapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/admin/bootstrap/config', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/bootstrap/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch bootstrap data:', error);
      toast.error('Failed to load bootstrap system data');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<BootstrapConfig>) => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/bootstrap/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        toast.success('Configuration updated successfully');
      } else {
        toast.error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      toast.error('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading bootstrap system...</div>
        </CardContent>
      </Card>
    );
  }

  if (!config || !stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Bootstrap system not configured</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bootstrap System Status
          </CardTitle>
          <CardDescription>
            Automated content generation to bootstrap platform activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="system-enabled" className="text-base font-semibold">
                System Enabled
              </Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all automated activity
              </p>
            </div>
            <Switch
              id="system-enabled"
              checked={config.isEnabled}
              onCheckedChange={(checked) => updateConfig({ isEnabled: checked })}
              disabled={saving}
            />
          </div>

          {/* Feature Toggles */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="auto-posting" className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Auto Posting
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Bots create posts
                </p>
              </div>
              <Switch
                id="auto-posting"
                checked={config.autoPostingEnabled}
                onCheckedChange={(checked) => updateConfig({ autoPostingEnabled: checked })}
                disabled={saving || !config.isEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="auto-comments" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Auto Comments
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Bots add comments
                </p>
              </div>
              <Switch
                id="auto-comments"
                checked={config.autoCommentsEnabled}
                onCheckedChange={(checked) => updateConfig({ autoCommentsEnabled: checked })}
                disabled={saving || !config.isEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="stream-announcements" className="text-sm font-medium flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Stream Alerts
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Announce streams
                </p>
              </div>
              <Switch
                id="stream-announcements"
                checked={config.streamAnnouncementsEnabled}
                onCheckedChange={(checked) => updateConfig({ streamAnnouncementsEnabled: checked })}
                disabled={saving || !config.isEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bot Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bot Accounts</CardTitle>
            <CardDescription>System-managed content creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.bots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bot.displayName}</span>
                      <Badge variant={bot.isActive ? 'default' : 'secondary'} className="text-xs">
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">@{bot.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {bot.botType} • Posts every {bot.postFrequencyMinutes}min
                    </p>
                    {bot.lastPostedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last post: {new Date(bot.lastPostedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Statistics</CardTitle>
            <CardDescription>Last 24 hours / All time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success Rate */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {stats.successRate.percentage}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {stats.successRate.successful} successful
                <XCircle className="h-3 w-3 text-red-500 ml-2" />
                {stats.successRate.total - stats.successRate.successful} failed
              </div>
            </div>

            {/* Activity Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Posts</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{stats.recentActivity.post || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalActivity.post || 0} total
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Comments</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{stats.recentActivity.comment || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalActivity.comment || 0} total
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Announcements</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{stats.recentActivity.announcement || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalActivity.announcement || 0} total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Settings</CardTitle>
          <CardDescription>Fine-tune automated behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-probability">Comment Probability</Label>
              <Input
                id="comment-probability"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.commentProbability}
                onChange={(e) => setConfig({ ...config, commentProbability: e.target.value })}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Chance of commenting on a post (0.0 - 1.0)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-comments">Max Comments Per Post</Label>
              <Input
                id="max-comments"
                type="number"
                min="0"
                max="10"
                value={config.maxCommentsPerPost}
                onChange={(e) => setConfig({ ...config, maxCommentsPerPost: parseInt(e.target.value) })}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Maximum bot comments per post
              </p>
            </div>
          </div>

          <Button
            onClick={() => updateConfig({
              commentProbability: config.commentProbability,
              maxCommentsPerPost: config.maxCommentsPerPost,
            })}
            disabled={saving}
          >
            Save Advanced Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
