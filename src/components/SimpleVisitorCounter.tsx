import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

/**
 * Simple public visitor counter
 * Shows total visits without requiring authentication
 */
export default function SimpleVisitorCounter() {
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/analytics/visitor-count');
        if (response.ok) {
          const data = await response.json();
          setTotalVisits(data.totalVisits || 0);
        }
      } catch (error) {
        console.error('Error fetching visitor count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Eye className="h-4 w-4" />
        <span>Cargando...</span>
      </div>
    );
  }

  if (totalVisits === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Eye className="h-4 w-4" />
      <span>
        <span className="font-semibold text-foreground">{totalVisits.toLocaleString('es-ES')}</span>
        {' '}visitas totales
      </span>
    </div>
  );
}
