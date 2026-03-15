/**
 * Live Connections Widget
 * Shows real-time connection count in a compact widget
 */

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionSummary {
  total: number;
  authenticated: number;
  anonymous: number;
}

export default function LiveConnectionsWidget() {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/analytics/connections/count');
      
      if (response.ok) {
        const data: ConnectionSummary = await response.json();
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching connection count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Refresh every 5 seconds
    const interval = setInterval(fetchCount, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Activity className="h-4 w-4 text-primary animate-pulse" />
      <Badge variant="secondary" className="gap-1">
        <span className="font-semibold">{total}</span>
        <span className="text-xs">online</span>
      </Badge>
    </div>
  );
}
