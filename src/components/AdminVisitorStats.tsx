import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, TrendingUp, Calendar, Globe } from 'lucide-react';

interface CountryData {
  country: string;
  countryCode: string;
  visits: number;
}

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  monthVisits: number;
  topCountries: CountryData[];
}

/**
 * Simple visitor statistics for admin dashboard
 * Shows key metrics in a clean, easy-to-read format
 */
export default function AdminVisitorStats() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/visitor-count');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalVisits: data.totalVisits || 0,
            uniqueVisitors: data.uniqueVisitors || 0,
            todayVisits: data.todayVisits || 0,
            monthVisits: data.monthVisits || 0,
            topCountries: data.topCountries || [],
          });
        }
      } catch (error) {
        console.error('Error fetching visitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Visitas</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(stats.totalVisits)}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitantes Únicos</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(stats.uniqueVisitors)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitas Hoy</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(stats.todayVisits)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(stats.monthVisits)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Countries */}
      {stats.topCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Países con Más Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCountries.map((country, index) => (
                <div key={country.countryCode} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="text-3xl">{getFlagEmoji(country.countryCode)}</span>
                    <span className="font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{formatNumber(country.visits)}</span>
                    <span className="text-sm text-muted-foreground">visitas</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Convert country code to flag emoji
 */
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}
