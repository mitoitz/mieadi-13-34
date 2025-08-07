import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  GraduationCap,
  AlertTriangle,
  Info,
  X
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'payment' | 'academic' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  category: string;
  actionUrl?: string;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Pagamento em Atraso",
      description: "Maria Silva tem mensalidade em atraso há 15 dias",
      type: "warning",
      priority: "high",
      timestamp: "2024-07-17 14:30:00",
      read: false,
      category: "financial",
      actionUrl: "/financeiro"
    },
    {
      id: "2", 
      title: "Novo Aluno Cadastrado",
      description: "João Santos foi cadastrado no curso de Teologia",
      type: "success",
      priority: "medium",
      timestamp: "2024-07-17 14:15:00",
      read: false,
      category: "academic"
    },
    {
      id: "3",
      title: "Backup Concluído",
      description: "Backup automático realizado com sucesso",
      type: "info", 
      priority: "low",
      timestamp: "2024-07-17 13:00:00",
      read: true,
      category: "system"
    },
    {
      id: "4",
      title: "Aula Cancelada",
      description: "Aula de Escatologia de hoje foi cancelada",
      type: "error",
      priority: "urgent",
      timestamp: "2024-07-17 12:45:00",
      read: false,
      category: "academic"
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'academic':
        return <GraduationCap className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <X className="h-4 w-4" />;
      case 'success':
        return <Check className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-600 text-white text-xs">Urgente</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="warning" className="text-xs">Média</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">-</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const academicNotifications = notifications.filter(n => n.category === 'academic');
  const financialNotifications = notifications.filter(n => n.category === 'financial');
  const systemNotifications = notifications.filter(n => n.category === 'system');

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div className={`border rounded-lg p-4 transition-all ${notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${
            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
            notification.type === 'error' ? 'bg-red-100 text-red-600' :
            notification.type === 'success' ? 'bg-green-100 text-green-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-sm ${!notification.read ? 'text-primary' : ''}`}>
                {notification.title}
              </h4>
              {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
              {getPriorityBadge(notification.priority)}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
            <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification.id)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteNotification(notification.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="academic">
              Acadêmico ({academicNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="financial">
              Financeiro ({financialNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="system">
              Sistema ({systemNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="academic">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {academicNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="financial">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {financialNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="system">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {systemNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}