import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, Database, Zap, RefreshCw } from 'lucide-react';
import { TestUtils } from '@/utils/test-helpers';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  connectionType: string;
  isOnline: boolean;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<'loading' | 'healthy' | 'warning' | 'error'>('loading');
  const [healthChecks, setHealthChecks] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const collectMetrics = async () => {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      
      const newMetrics: PerformanceMetrics = {
        loadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
        renderTime: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        isOnline: navigator.onLine
      };
      
      setMetrics(newMetrics);
      
      // Executar health check
      const healthResult = await TestUtils.runHealthCheck();
      setHealthStatus(healthResult.overall);
      setHealthChecks(healthResult.checks);
      
    } catch (error) {
      console.error('Erro ao coletar métricas:', error);
      setHealthStatus('error');
    }
  };

  useEffect(() => {
    collectMetrics();
    
    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(collectMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>
    ) : (
      <Badge variant="destructive">Erro</Badge>
    );
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(healthStatus)}`} />
            Monitor de Performance
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={collectMetrics}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {metrics && (
          <>
            {/* Métricas de Performance */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Tempo de Carregamento
                </span>
                <span className="font-mono">
                  {(metrics.loadTime / 1000).toFixed(2)}s
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Tempo de Renderização
                </span>
                <span className="font-mono">
                  {(metrics.renderTime / 1000).toFixed(2)}s
                </span>
              </div>
              
              {metrics.memoryUsage > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Uso de Memória
                  </span>
                  <span className="font-mono">
                    {formatBytes(metrics.memoryUsage)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Conexão
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{metrics.connectionType}</span>
                  {getStatusBadge(metrics.isOnline)}
                </div>
              </div>
            </div>

            {/* Health Checks */}
            {healthChecks.length > 0 && (
              <div className="border-t pt-2">
                <h4 className="text-xs font-semibold mb-2">Status do Sistema</h4>
                <div className="space-y-1">
                  {healthChecks.map((check, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span>{check.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">{check.message}</span>
                        {getStatusBadge(check.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertas de Performance */}
            {metrics.loadTime > 3000 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-800">
                  ⚠️ Carregamento lento detectado
                </p>
              </div>
            )}
            
            {metrics.memoryUsage > 50 * 1024 * 1024 && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-800">
                  ⚠️ Alto uso de memória
                </p>
              </div>
            )}
          </>
        )}
        
        {!metrics && (
          <div className="text-center text-xs text-muted-foreground">
            Coletando métricas...
          </div>
        )}
      </CardContent>
    </Card>
  );
}