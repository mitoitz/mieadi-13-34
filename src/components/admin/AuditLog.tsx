import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { 
  Eye, 
  User, 
  Shield, 
  Database, 
  Settings, 
  Download,
  Search,
  Filter,
  Calendar,
  FileText
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: 'auth' | 'data' | 'system' | 'user' | 'financial';
  description: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Dados simulados de auditoria
  const auditLogs: AuditEntry[] = [
    {
      id: "1",
      timestamp: "2024-07-17 14:30:25",
      userId: "admin-001",
      userName: "João Diretor",
      action: "LOGIN_SUCCESS",
      category: "auth",
      description: "Login realizado com sucesso",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "low"
    },
    {
      id: "2",
      timestamp: "2024-07-17 14:25:12",
      userId: "user-123",
      userName: "Maria Santos",
      action: "UPDATE_PROFILE",
      category: "user",
      description: "Perfil do usuário atualizado",
      ipAddress: "192.168.1.105",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "low"
    },
    {
      id: "3",
      timestamp: "2024-07-17 14:20:08",
      userId: "admin-001",
      userName: "João Diretor",
      action: "DELETE_USER",
      category: "user",
      description: "Usuário removido do sistema: Pedro Silva",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "high"
    },
    {
      id: "4",
      timestamp: "2024-07-17 14:15:33",
      userId: "system",
      userName: "Sistema",
      action: "BACKUP_COMPLETED",
      category: "system",
      description: "Backup automático concluído com sucesso",
      ipAddress: "127.0.0.1",
      userAgent: "System Process",
      severity: "low"
    },
    {
      id: "5",
      timestamp: "2024-07-17 14:10:19",
      userId: "user-456",
      userName: "Pedro Costa",
      action: "FAILED_LOGIN",
      category: "auth",
      description: "Tentativa de login falhada - senha incorreta",
      ipAddress: "203.0.113.25",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      severity: "medium"
    },
    {
      id: "6",
      timestamp: "2024-07-17 14:05:45",
      userId: "admin-001",
      userName: "João Diretor",
      action: "CONFIG_CHANGE",
      category: "system",
      description: "Configurações de segurança alteradas",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "critical"
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Shield className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'financial': return <FileText className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="success" className="text-xs">Baixa</Badge>;
      case 'medium':
        return <Badge variant="warning" className="text-xs">Média</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'critical':
        return <Badge className="bg-red-600 text-white text-xs">Crítica</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">-</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'auth': return 'Autenticação';
      case 'data': return 'Dados';
      case 'system': return 'Sistema';
      case 'user': return 'Usuário';
      case 'financial': return 'Financeiro';
      default: return category;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Log de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição, usuário ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="auth">Autenticação</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="data">Dados</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gravidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Lista de logs */}
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getCategoryIcon(log.category)}
                      <span className="text-xs font-medium">{getCategoryLabel(log.category)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.userName}</span>
                        <span className="text-xs text-muted-foreground">({log.userId})</span>
                        {getSeverityBadge(log.severity)}
                      </div>
                      <p className="text-sm text-foreground mb-2">{log.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {log.timestamp}
                        </span>
                        <span>IP: {log.ipAddress}</span>
                        <span className="font-mono">{log.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum log encontrado com os filtros aplicados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}