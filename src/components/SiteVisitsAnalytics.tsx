import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, TrendingUp, Calendar, Globe, UserCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';

interface SiteStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  topPages: Array<{ page: string; visits: number }>;
  visitsByDay: Array<{ date: string; visits: number }>;
  authenticatedVisits: number;
  anonymousVisits: number;
}

export default function SiteVisitsAnalytics() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔄 Fetching site stats...');
        setLoading(true);
        const data = await apiFetch('/api/analytics/site-stats') as unknown as SiteStats;
        console.log('📊 Site stats received:', data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Total visits:', data?.totalVisits);
        console.log('📊 Unique visitors:', data?.uniqueVisitors);
        
        // Validate data structure
        if (data && typeof data === 'object') {
          console.log('✅ Setting stats state');
          setStats(data);
        } else {
          console.error('❌ Invalid stats data:', data);
          setStats(null);
        }
      } catch (error) {
        console.error('❌ Error fetching site stats:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
        setStats(null);
      } finally {
        console.log('✅ Loading complete');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No se pudieron cargar los datos de visitas</p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Por favor, abre la consola del navegador (F12) para ver los detalles del error
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Si acabas de actualizar la página, intenta refrescar con Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num || 0);
  };

  // Ensure arrays exist with defaults
  const topPages = stats.topPages || [];
  const visitsByDay = stats.visitsByDay || [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalVisits || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas las visitas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.uniqueVisitors || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sesiones únicas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.todayVisits || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Esta semana: {formatNumber(stats.weekVisits || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.monthVisits || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitas mensuales</p>
          </CardContent>
        </Card>
      </div>

      {/* User Type Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de Visitantes</CardTitle>
            <CardDescription>Distribución de usuarios autenticados vs anónimos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Autenticados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{formatNumber(stats.authenticatedVisits || 0)}</span>
                <Badge variant="secondary">
                  {stats.totalVisits > 0 
                    ? (((stats.authenticatedVisits || 0) / stats.totalVisits) * 100).toFixed(1)
                    : '0.0'}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Anónimos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{formatNumber(stats.anonymousVisits || 0)}</span>
                <Badge variant="outline">
                  {stats.totalVisits > 0
                    ? (((stats.anonymousVisits || 0) / stats.totalVisits) * 100).toFixed(1)
                    : '0.0'}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Páginas Más Visitadas</CardTitle>
            <CardDescription>Top 10 páginas por número de visitas</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.slice(0, 5).map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="flex-shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm truncate">{page.page || '/'}</span>
                    </div>
                    <span className="text-sm font-semibold">{formatNumber(page.visits)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos de páginas aún
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visits by Day Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitas por Día (Últimos 30 días)</CardTitle>
          <CardDescription>Tendencia de visitas diarias</CardDescription>
        </CardHeader>
        <CardContent>
          {visitsByDay.length > 0 ? (
            <div className="space-y-2">
              {visitsByDay.slice(-7).map((day) => {
                const maxVisits = Math.max(...visitsByDay.map((d) => d.visits), 1);
                const percentage = (day.visits / maxVisits) * 100;
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="font-semibold">{formatNumber(day.visits)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos de visitas por día aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
