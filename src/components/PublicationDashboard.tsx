/**
 * Publication Dashboard
 * Comprehensive interface for deploying and managing publications
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  RefreshCw,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  version: string;
  timestamp: string;
  duration?: number;
  url?: string;
  error?: string;
}

interface PublicationDashboardProps {
  onPublish?: () => void;
}

export default function PublicationDashboard({ onPublish }: PublicationDashboardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentStatus | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentStatus[]>([]);
  const [publishProgress, setPublishProgress] = useState(0);

  // Pre-publish checklist
  const [checklist, setChecklist] = useState({
    buildPasses: false,
    testsPass: false,
    noErrors: false,
    changesCommitted: false,
  });

  useEffect(() => {
    // Simulate checking build status
    const checkBuildStatus = async () => {
      // In a real app, this would call your build API
      setChecklist({
        buildPasses: true,
        testsPass: true,
        noErrors: true,
        changesCommitted: true,
      });
    };

    checkBuildStatus();
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishProgress(0);

    try {
      // Simulate deployment stages
      const stages = [
        { name: 'Building...', progress: 25 },
        { name: 'Testing...', progress: 50 },
        { name: 'Deploying...', progress: 75 },
        { name: 'Finalizing...', progress: 100 },
      ];

      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPublishProgress(stage.progress);
        toast.info(stage.name);
      }

      const deployment: DeploymentStatus = {
        id: `deploy-${Date.now()}`,
        status: 'success',
        version: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration: 4,
        url: 'https://astruxo.net',
      };

      setCurrentDeployment(deployment);
      setDeploymentHistory(prev => [deployment, ...prev].slice(0, 5));
      toast.success('Successfully published!');
      onPublish?.();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish');
      setCurrentDeployment({
        id: `deploy-${Date.now()}`,
        status: 'failed',
        version: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        error: String(error),
      });
    } finally {
      setIsPublishing(false);
      setPublishProgress(0);
    }
  };

  const allChecksPassed = Object.values(checklist).every(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Publication Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Deploy your application to production with confidence
        </p>
      </div>

      {/* Pre-Publish Checklist */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Pre-Publish Checklist
          </CardTitle>
          <CardDescription>
            Ensure everything is ready before deploying
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChecklistItem
            label="Build passes successfully"
            checked={checklist.buildPasses}
          />
          <ChecklistItem
            label="All tests pass"
            checked={checklist.testsPass}
          />
          <ChecklistItem
            label="No critical errors"
            checked={checklist.noErrors}
          />
          <ChecklistItem
            label="Changes committed to git"
            checked={checklist.changesCommitted}
          />
        </CardContent>
      </Card>

      {/* Publish Button */}
      <Card className="glass-card border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Ready to Deploy</h3>
              <p className="text-sm text-muted-foreground">
                {allChecksPassed
                  ? 'All checks passed. Your app is ready to go live!'
                  : 'Please resolve checklist items before publishing'}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handlePublish}
              disabled={!allChecksPassed || isPublishing}
              className="gap-2"
            >
              <Rocket className="h-5 w-5" />
              {isPublishing ? 'Publishing...' : 'Publish Now'}
            </Button>
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {isPublishing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Progress value={publishProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {publishProgress}% complete
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Current Deployment Status */}
      {currentDeployment && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Current Deployment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeploymentStatusCard deployment={currentDeployment} />
          </CardContent>
        </Card>
      )}

      {/* Deployment History */}
      {deploymentHistory.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Deployments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deploymentHistory.map((deployment, index) => (
              <div key={deployment.id}>
                {index > 0 && <Separator className="my-3" />}
                <DeploymentStatusCard deployment={deployment} compact />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}

function DeploymentStatusCard({
  deployment,
  compact = false,
}: {
  deployment: DeploymentStatus;
  compact?: boolean;
}) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pending' },
    building: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Building' },
    deploying: { icon: Rocket, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Deploying' },
    success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Success' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' },
  };

  const config = statusConfig[deployment.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-4 ${compact ? 'py-2' : 'py-3'}`}>
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{deployment.version}</Badge>
          <Badge className={config.bg}>{config.label}</Badge>
          {deployment.duration && (
            <span className="text-sm text-muted-foreground">
              {deployment.duration}s
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(deployment.timestamp).toLocaleString()}
        </p>
        {deployment.url && (
          <a
            href={deployment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-1 inline-block"
          >
            {deployment.url}
          </a>
        )}
        {deployment.error && (
          <p className="text-sm text-red-500 mt-1">{deployment.error}</p>
        )}
      </div>
    </div>
  );
}
