import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Play,
  Calendar,
  FileText,
  Eye,
  Star,
  Timer,
  Award,
  Bell,
  BookOpen,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { notificationService } from "@/services/notifications.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Avaliacao {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  start_date?: string;
  end_date?: string;
  duration_minutes?: number;
  class_id: string;
  created_at: string;
  classes?: { name: string };
  disciplina?: { nome: string };
  professor?: { nome: string };
  total_questions?: number;
  nota?: number;
  submitted: boolean;
  submitted_at?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export default function MinhasAvaliacoes() {
  const { user } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [showAvaliacaoDialog, setShowAvaliacaoDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAvaliacoes();
      loadNotifications();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      
      // Buscar matriculas do aluno
      const { data: matriculas, error: matriculasError } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes (
            id,
            name
          )
        `)
        .eq('student_id', user?.id);

      if (matriculasError) throw matriculasError;

      const classIds = matriculas?.map(m => m.class_id) || [];

      if (classIds.length === 0) {
        setAvaliacoes([]);
        return;
      }

      // Buscar avaliações das turmas do aluno
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          classes (
            name
          )
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Verificar submissões do aluno para cada avaliação
      const avaliacoesComStatus = await Promise.all(
        (assessments || []).map(async (assessment) => {
          // Buscar questões da avaliação
          const { count: questionsCount } = await supabase
            .from('assessment_questions')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          // Verificar se o aluno já respondeu (simplificado por enquanto)
          // TODO: Implementar tabela de submissões quando estiver disponível
          const submitted = false;
          const submitted_at = null;
          const nota = Math.floor(Math.random() * 10) + 1; // Mock para demonstração

          return {
            ...assessment,
            status: 'active' as 'draft' | 'active' | 'closed', // Simplificado por enquanto
            disciplina: { nome: assessment.classes?.name || 'Disciplina' },
            professor: { nome: 'Professor da Disciplina' }, // Mock
            total_questions: questionsCount || 0,
            submitted,
            submitted_at,
            nota: submitted ? nota : undefined
          };
        })
      );

      setAvaliacoes(avaliacoesComStatus);
    } catch (error) {
      console.error('Error loading avaliacoes:', error);
      toast.error("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      if (!user?.id) return;
      
      const userNotifications = await notificationService.getUserNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    // Subscription para novas avaliações
    const assessmentsChannel = supabase
      .channel('assessments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assessments'
        },
        (payload) => {
          console.log('Assessment change detected:', payload);
          loadAvaliacoes();
          
          // Criar notificação para nova avaliação
          if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
            createAvaliacaoNotification(payload.new);
          }
        }
      )
      .subscribe();

    // Subscription para notificações
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change detected:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assessmentsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  };

  const createAvaliacaoNotification = async (avaliacao: any) => {
    try {
      await notificationService.createNotification({
        user_id: user?.id!,
        title: "Nova Avaliação Disponível",
        message: `A avaliação "${avaliacao.title}" foi liberada e está disponível para resposta.`,
        type: 'info',
        read: false,
        expires_at: avaliacao.end_date
      });

      toast.success("Nova avaliação disponível!");
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      if (!user?.id) return;
      await notificationService.markAllAsRead(user.id);
      loadNotifications();
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const openAvaliacao = (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setShowAvaliacaoDialog(true);
  };

  const startAvaliacao = (avaliacaoId: string) => {
    // Redirecionar para página de realização da avaliação
    toast.info("Redirecionando para a avaliação...");
    // Implementar navegação para /avaliacoes/:id
  };

  const getStatusBadge = (avaliacao: Avaliacao) => {
    if (avaliacao.submitted) {
      return <Badge variant="default" className="bg-green-600">Enviada</Badge>;
    }
    
    if (avaliacao.status === 'active') {
      const now = new Date();
      const endDate = avaliacao.end_date ? new Date(avaliacao.end_date) : null;
      
      if (endDate && now > endDate) {
        return <Badge variant="destructive">Expirada</Badge>;
      }
      
      return <Badge variant="default">Disponível</Badge>;
    }
    
    if (avaliacao.status === 'closed') {
      return <Badge variant="outline">Encerrada</Badge>;
    }
    
    return <Badge variant="secondary">Aguardando</Badge>;
  };

  const getNotaColor = (nota?: number) => {
    if (!nota && nota !== 0) return "text-muted-foreground";
    if (nota >= 8) return "text-green-600 font-semibold";
    if (nota >= 6) return "text-blue-600 font-semibold";
    if (nota >= 4) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const avaliacoesDisponiveis = avaliacoes.filter(a => 
    a.status === 'active' && !a.submitted
  );
  
  const avaliacoesRealizadas = avaliacoes.filter(a => a.submitted);
  
  const avaliacoesExpiradas = avaliacoes.filter(a => {
    const now = new Date();
    const endDate = a.end_date ? new Date(a.end_date) : null;
    return a.status === 'active' && !a.submitted && endDate && now > endDate;
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Avaliações</h1>
          <p className="text-muted-foreground">
            Acompanhe suas avaliações, notas e desempenho acadêmico
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowNotifications(true)}
            className="relative"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notificações
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1 py-0 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponíveis</p>
                <div className="text-2xl font-bold text-blue-600">{avaliacoesDisponiveis.length}</div>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Timer className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Realizadas</p>
                <div className="text-2xl font-bold text-green-600">{avaliacoesRealizadas.length}</div>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiradas</p>
                <div className="text-2xl font-bold text-red-600">{avaliacoesExpiradas.length}</div>
              </div>
              <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                <div className={`text-2xl font-bold ${getNotaColor(
                  avaliacoesRealizadas.length > 0 
                    ? avaliacoesRealizadas.reduce((acc, a) => acc + (a.nota || 0), 0) / avaliacoesRealizadas.length
                    : 0
                )}`}>
                  {avaliacoesRealizadas.length > 0 
                    ? (avaliacoesRealizadas.reduce((acc, a) => acc + (a.nota || 0), 0) / avaliacoesRealizadas.length).toFixed(1)
                    : "-"}
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="disponiveis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="disponiveis">
            Disponíveis ({avaliacoesDisponiveis.length})
          </TabsTrigger>
          <TabsTrigger value="realizadas">
            Realizadas ({avaliacoesRealizadas.length})
          </TabsTrigger>
          <TabsTrigger value="todas">
            Todas ({avaliacoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis">
          <div className="space-y-4">
            {avaliacoesDisponiveis.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma avaliação disponível</p>
                    <p>Você está em dia com suas avaliações!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              avaliacoesDisponiveis.map((avaliacao) => (
                <Card key={avaliacao.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{avaliacao.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {avaliacao.disciplina?.nome} • Prof. {avaliacao.professor?.nome}
                            </p>
                          </div>
                          {getStatusBadge(avaliacao)}
                        </div>
                        
                        {avaliacao.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {avaliacao.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm">
                          {avaliacao.total_questions && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{avaliacao.total_questions} questões</span>
                            </div>
                          )}
                          {avaliacao.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{avaliacao.duration_minutes} minutos</span>
                            </div>
                          )}
                          {avaliacao.end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Até {format(new Date(avaliacao.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openAvaliacao(avaliacao)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Button>
                        <Button onClick={() => startAvaliacao(avaliacao.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Iniciar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="realizadas">
          <div className="space-y-4">
            {avaliacoesRealizadas.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma avaliação realizada</p>
                    <p>Suas avaliações concluídas aparecerão aqui</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              avaliacoesRealizadas.map((avaliacao) => (
                <Card key={avaliacao.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{avaliacao.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {avaliacao.disciplina?.nome} • Prof. {avaliacao.professor?.nome}
                            </p>
                          </div>
                          {getStatusBadge(avaliacao)}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          {avaliacao.submitted_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Enviada em {format(new Date(avaliacao.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {avaliacao.nota !== undefined && avaliacao.nota !== null ? (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Nota</p>
                            <p className={`text-2xl font-bold ${getNotaColor(avaliacao.nota)}`}>
                              {avaliacao.nota.toFixed(1)}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline">Aguardando correção</Badge>
                        )}
                        
                        <Button variant="outline" onClick={() => openAvaliacao(avaliacao)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="todas">
          <div className="space-y-4">
            {avaliacoes.map((avaliacao) => (
              <Card key={avaliacao.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{avaliacao.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {avaliacao.disciplina?.nome} • Prof. {avaliacao.professor?.nome}
                          </p>
                        </div>
                        {getStatusBadge(avaliacao)}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Criada em {format(new Date(avaliacao.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        {avaliacao.submitted_at && (
                          <span>Enviada em {format(new Date(avaliacao.submitted_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {avaliacao.nota !== undefined && avaliacao.nota !== null && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Nota</p>
                          <p className={`text-xl font-bold ${getNotaColor(avaliacao.nota)}`}>
                            {avaliacao.nota.toFixed(1)}
                          </p>
                        </div>
                      )}
                      
                      <Button variant="outline" onClick={() => openAvaliacao(avaliacao)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes da Avaliação */}
      <Dialog open={showAvaliacaoDialog} onOpenChange={setShowAvaliacaoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAvaliacao?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedAvaliacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Disciplina</p>
                  <p className="font-medium">{selectedAvaliacao.disciplina?.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Professor</p>
                  <p className="font-medium">{selectedAvaliacao.professor?.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedAvaliacao)}
                </div>
                {selectedAvaliacao.nota !== undefined && selectedAvaliacao.nota !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nota</p>
                    <p className={`text-xl font-bold ${getNotaColor(selectedAvaliacao.nota)}`}>
                      {selectedAvaliacao.nota.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedAvaliacao.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                  <p className="text-sm">{selectedAvaliacao.description}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                {selectedAvaliacao.status === 'active' && !selectedAvaliacao.submitted && (
                  <Button onClick={() => startAvaliacao(selectedAvaliacao.id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Avaliação
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Notificações */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notificações</span>
              {unreadNotifications > 0 && (
                <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>
                  Marcar todas como lidas
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    notification.read ? 'bg-muted/30' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}