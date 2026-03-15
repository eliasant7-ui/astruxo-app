import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertCircle,
  Download,
  FileText,
  GitBranch,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

interface HealthMetrics {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'critical';
  lastCheck: string;
  uptime: number;
  version: string;
}

interface SystemStats {
  visitors24h: number;
  uniqueVisitors: number;
  activeStreams: number;
  totalUsers: number;
  countries: number;
}

interface MaintenanceIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  count?: number;
  action?: string;
}

interface DependencyUpdate {
  name: string;
  current: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

export default function SystemHealthDashboard() {
  const [loading, setLoading] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [healthMetrics] = useState<HealthMetrics>({
    score: 85,
    status: 'good',
    lastCheck: '2026-03-10T14:00:00Z',
    uptime: 99.9,
    version: '964c097',
  });

  const [systemStats] = useState<SystemStats>({
    visitors24h: 2941,
    uniqueVisitors: 1006,
    activeStreams: 3,
    totalUsers: 1250,
    countries: 10,
  });

  const [issues] = useState<MaintenanceIssue[]>([
    {
      type: 'warning',
      category: 'TypeScript',
      message: 'Variables no usadas encontradas',
      count: 37,
      action: 'npm run lint:fix',
    },
    {
      type: 'warning',
      category: 'Dependencias',
      message: 'Paquetes desactualizados',
      count: 19,
      action: 'npm update',
    },
    {
      type: 'info',
      category: 'Código',
      message: 'Console.logs en producción',
      count: 8,
      action: 'Limpiar manualmente',
    },
  ]);

  const [dependencies] = useState<DependencyUpdate[]>([
    { name: '@godaddy/react', current: '1.0.13', latest: '1.0.30', type: 'minor' },
    { name: '@stripe/stripe-js', current: '7.9.0', latest: '8.9.0', type: 'major' },
    { name: '@types/node', current: '22.19.1', latest: '25.4.0', type: 'major' },
  ]);

  const [maintenanceLogs, setMaintenanceLogs] = useState<string[]>([
    '[2026-03-10 14:00:00] ✅ Sistema iniciado correctamente',
    '[2026-03-10 14:00:05] 📊 Health Score: 85/100',
    '[2026-03-10 14:00:10] ⚠️  37 variables no usadas detectadas',
    '[2026-03-10 14:00:15] ⚠️  19 dependencias desactualizadas',
    '[2026-03-10 14:00:20] ✅ Build exitoso',
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'fair':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-500">Excelente</Badge>;
      case 'good':
        return <Badge className="bg-blue-500">Bueno</Badge>;
      case 'fair':
        return <Badge className="bg-yellow-500">Regular</Badge>;
      case 'critical':
        return <Badge className="bg-red-500">Crítico</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const runHealthCheck = async () => {
    setRunningCheck(true);
    setMaintenanceLogs((prev) => [
      `[${new Date().toLocaleString()}] 🔄 Iniciando verificación de salud...`,
      ...prev,
    ]);

    // Simular verificación (en producción, esto llamaría a un endpoint real)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setMaintenanceLogs((prev) => [
      `[${new Date().toLocaleString()}] ✅ Verificación completada`,
      `[${new Date().toLocaleString()}] 📊 Health Score: ${healthMetrics.score}/100`,
      ...prev,
    ]);

    setRunningCheck(false);
  };

  const applyFix = async (action: string) => {
    setLoading(true);
    setMaintenanceLogs((prev) => [
      `[${new Date().toLocaleString()}] 🔧 Ejecutando: ${action}`,
      ...prev,
    ]);

    // Simular aplicación de fix
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setMaintenanceLogs((prev) => [
      `[${new Date().toLocaleString()}] ✅ Comando ejecutado exitosamente`,
      ...prev,
    ]);

    setLoading(false);
  };

  const updateDependency = async (name: string) => {
    setLoading(true);
    setMaintenanceLogs((prev) => [
      `[${new Date().toLocaleString()}] 📦 Actualizando ${name}...`,
      ...prev,
    ]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setMaintenanceLogs((prev) => [
      `[${new Date().toLocaleString()}] ✅ ${name} actualizado correctamente`,
      ...prev,
    ]);

    setLoading(false);
  };

  const downloadLogs = () => {
    const logsText = maintenanceLogs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header con Health Score */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className={`h-4 w-4 ${getStatusColor(healthMetrics.status)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.score}/100</div>
            <div className="mt-2">{getStatusBadge(healthMetrics.status)}</div>
            <Progress value={healthMetrics.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.visitors24h.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.uniqueVisitors.toLocaleString()} únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versión</CardTitle>
            <GitBranch className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.version}</div>
            <p className="text-xs text-muted-foreground">Producción estable</p>
          </CardContent>
        </Card>
      </div>

      {/* Botones de Acción Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Ejecutar verificaciones y mantenimiento del sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={runHealthCheck} disabled={runningCheck}>
            {runningCheck ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Ejecutar Verificación
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => applyFix('npm run lint:fix')} disabled={loading}>
            <Zap className="mr-2 h-4 w-4" />
            Auto-Fix Linting
          </Button>
          <Button variant="outline" onClick={() => applyFix('npm update')} disabled={loading}>
            <Package className="mr-2 h-4 w-4" />
            Actualizar Deps
          </Button>
          <Button variant="outline" onClick={downloadLogs}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Logs
          </Button>
        </CardContent>
      </Card>

      {/* Tabs con Información Detallada */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">
            <AlertCircle className="mr-2 h-4 w-4" />
            Problemas ({issues.length})
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <Package className="mr-2 h-4 w-4" />
            Dependencias ({dependencies.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="mr-2 h-4 w-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="mr-2 h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="docs">
            <FileText className="mr-2 h-4 w-4" />
            Documentación
          </TabsTrigger>
        </TabsList>

        {/* Tab: Problemas */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Problemas Detectados</CardTitle>
              <CardDescription>
                Problemas menores que no afectan la funcionalidad actual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {issues.map((issue, index) => (
                <Alert key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getIssueIcon(issue.type)}
                      <div>
                        <AlertTitle className="mb-1">
                          {issue.category}
                          {issue.count && (
                            <Badge variant="outline" className="ml-2">
                              {issue.count}
                            </Badge>
                          )}
                        </AlertTitle>
                        <AlertDescription>{issue.message}</AlertDescription>
                        {issue.action && (
                          <code className="mt-2 block rounded bg-muted px-2 py-1 text-xs">
                            {issue.action}
                          </code>
                        )}
                      </div>
                    </div>
                    {issue.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyFix(issue.action!)}
                        disabled={loading}
                      >
                        Aplicar Fix
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dependencias */}
        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dependencias Desactualizadas</CardTitle>
              <CardDescription>Paquetes que tienen actualizaciones disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dependencies.map((dep, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{dep.name}</p>
                        <Badge
                          variant={dep.type === 'major' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {dep.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dep.current} → {dep.latest}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDependency(dep.name)}
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Actualizar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estadísticas */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tráfico (24h)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visitas Totales</span>
                  <span className="font-bold">{systemStats.visitors24h.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visitantes Únicos</span>
                  <span className="font-bold">{systemStats.uniqueVisitors.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Países</span>
                  <span className="font-bold">{systemStats.countries}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streams Activos</span>
                  <span className="font-bold">{systemStats.activeStreams}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Usuarios Totales</span>
                  <span className="font-bold">{systemStats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="font-bold">{healthMetrics.uptime}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Mantenimiento</CardTitle>
              <CardDescription>Historial de verificaciones y acciones ejecutadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-2 font-mono text-sm">
                  {maintenanceLogs.map((log, index) => (
                    <div key={index} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentación */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentación de Mantenimiento</CardTitle>
              <CardDescription>
                Guías y recursos para el mantenimiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <a
                  href="/EXECUTIVE_SUMMARY_ES.md"
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Resumen Ejecutivo</p>
                      <p className="text-sm text-muted-foreground">
                        Estado del sistema y acciones recomendadas (2 min)
                      </p>
                    </div>
                  </div>
                  <Badge>Español</Badge>
                </a>

                <a
                  href="/RESUMEN_MANTENIMIENTO_ES.md"
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Guía Completa de Mantenimiento</p>
                      <p className="text-sm text-muted-foreground">
                        Instrucciones detalladas y procedimientos (15 min)
                      </p>
                    </div>
                  </div>
                  <Badge>Español</Badge>
                </a>

                <a
                  href="/SYSTEM_HEALTH_REPORT.md"
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Reporte Técnico Completo</p>
                      <p className="text-sm text-muted-foreground">
                        Análisis técnico profundo y optimizaciones (30 min)
                      </p>
                    </div>
                  </div>
                  <Badge>English</Badge>
                </a>

                <a
                  href="/QUICK_MAINTENANCE_GUIDE.md"
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Guía Rápida</p>
                      <p className="text-sm text-muted-foreground">
                        Referencia rápida y comandos esenciales (5 min)
                      </p>
                    </div>
                  </div>
                  <Badge>English</Badge>
                </a>

                <a
                  href="/MAINTENANCE_INDEX.md"
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-cyan-500" />
                    <div>
                      <p className="font-medium">Índice de Documentación</p>
                      <p className="text-sm text-muted-foreground">
                        Guía completa de toda la documentación disponible
                      </p>
                    </div>
                  </div>
                  <Badge>Bilingüe</Badge>
                </a>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Sistema de Mantenimiento Automático</AlertTitle>
                <AlertDescription>
                  El script de mantenimiento se ejecuta automáticamente todos los domingos a las
                  12:00 AM. Los logs se guardan en <code>maintenance-logs/</code>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
