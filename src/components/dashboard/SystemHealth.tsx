import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface SystemHealthProps {
  className?: string;
}

export function SystemHealth({ className }: SystemHealthProps) {
  const healthMetrics = [
    {
      name: "Servidor Principal",
      status: "healthy",
      uptime: "99.9%",
      responseTime: "45ms",
      icon: Server,
    },
    {
      name: "Base de Dados",
      status: "healthy", 
      uptime: "99.8%",
      responseTime: "12ms",
      icon: Database,
    },
    {
      name: "Autenticação",
      status: "warning",
      uptime: "98.5%",
      responseTime: "89ms", 
      icon: Users,
    },
    {
      name: "API Gateway",
      status: "healthy",
      uptime: "99.7%",
      responseTime: "23ms",
      icon: Activity,
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="success" className="text-xs">Saudável</Badge>;
      case "warning":
        return <Badge variant="warning" className="text-xs">Atenção</Badge>;
      case "error":
        return <Badge variant="destructive" className="text-xs">Erro</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Desconhecido</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Saúde do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const uptimeValue = parseFloat(metric.uptime.replace('%', ''));
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metric.name}</span>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>Uptime: {metric.uptime}</span>
                    <span>•</span>
                    <span>Resposta: {metric.responseTime}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(metric.status)}
                <div className="mt-2 w-20">
                  <Progress value={uptimeValue} className="h-2" />
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Todos os serviços operacionais</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Última verificação: há 2 minutos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}