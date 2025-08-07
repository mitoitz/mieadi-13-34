import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  UserPlus, 
  BookOpen, 
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Users,
  GraduationCap,
  Clock,
  Bell,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuickActionsManager } from "../actions/QuickActionsManager";
import { AdminPINResetButton } from "./AdminPINResetButton";

interface QuickActionsProps {
  userType: string;
  onActionClick?: (action: string) => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  badge?: string;
  permission?: string[];
  implemented?: boolean;
}

export function QuickActions({ userType, onActionClick }: QuickActionsProps) {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const getActionsForUserType = (type: string): QuickAction[] => {
    const allActions: QuickAction[] = [
      {
        id: "new-student",
        title: "Novo Aluno",
        description: "Cadastrar novo estudante",
        icon: UserPlus,
        color: "blue",
        permission: ["admin", "secretario", "coordenador"],
        implemented: true
      },
      {
        id: "new-class",
        title: "Nova Turma",
        description: "Criar turma para disciplina",
        icon: Users,
        color: "green",
        permission: ["admin", "coordenador"],
        implemented: true
      },
      {
        id: "schedule-class",
        title: "Agendar Aula",
        description: "Agendar nova aula",
        icon: Calendar,
        color: "purple",
        permission: ["professor", "coordenador"],
        implemented: true
      },
      {
        id: "new-payment",
        title: "Lançar Pagamento",
        description: "Registrar novo pagamento",
        icon: DollarSign,
        color: "yellow",
        permission: ["admin", "secretario"],
        implemented: true
      },
      {
        id: "create-assessment",
        title: "Nova Avaliação",
        description: "Criar avaliação para turma",
        icon: FileText,
        color: "orange",
        permission: ["professor"],
        implemented: true
      },
      {
        id: "attendance-control",
        title: "Controle de Presença",
        description: "Registrar presença de alunos",
        icon: Clock,
        color: "red",
        permission: ["professor", "secretario"],
        implemented: true
      },
      {
        id: "generate-report",
        title: "Gerar Relatório",
        description: "Criar relatório personalizado",
        icon: Download,
        color: "gray",
        permission: ["admin", "coordenador", "secretario"],
        implemented: true
      },
      {
        id: "send-notification",
        title: "Enviar Comunicado",
        description: "Comunicado para alunos/professores",
        icon: Bell,
        color: "indigo",
        permission: ["admin", "coordenador", "secretario"],
        implemented: true
      },
      {
        id: "new-course",
        title: "Novo Curso",
        description: "Cadastrar novo curso",
        icon: GraduationCap,
        color: "emerald",
        permission: ["admin", "coordenador"],
        implemented: true
      },
      {
        id: "new-subject",
        title: "Nova Disciplina",
        description: "Cadastrar nova disciplina",
        icon: BookOpen,
        color: "cyan",
        permission: ["admin", "coordenador"],
        implemented: true
      }
    ];

    return allActions.filter(action => 
      !action.permission || action.permission.includes(type)
    );
  };

  const handleActionClick = (actionId: string, actionTitle: string) => {
    const action = getActionsForUserType(userType).find(a => a.id === actionId);
    
    if (action?.implemented) {
      setActiveAction(actionId);
    } else if (onActionClick) {
      onActionClick(actionId);
    } else {
      toast({
        title: "Ação selecionada",
        description: `${actionTitle} será implementada em breve.`,
      });
    }
  };

  const actions = getActionsForUserType(userType);

  const ActionButton = ({ action }: { action: QuickAction }) => (
    <Card 
      className="hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => handleActionClick(action.id, action.title)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/20 group-hover:scale-105 transition-transform`}>
              <action.icon className={`h-5 w-5 text-${action.color}-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {action.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {action.badge && (
              <Badge variant="secondary" className="text-xs">
                {action.badge}
              </Badge>
            )}
            {action.implemented && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Ativo
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getQuickStats = () => {
    switch (userType) {
      case "admin":
        return [
          { label: "Alunos Ativos", value: "142", trend: "+8%" },
          { label: "Turmas", value: "12", trend: "+2" },
          { label: "Professores", value: "18", trend: "0%" }
        ];
      case "professor":
        return [
          { label: "Minhas Turmas", value: "4", trend: "+1" },
          { label: "Alunos Total", value: "68", trend: "+3%" },
          { label: "Avaliações", value: "7", trend: "+2" }
        ];
      case "secretario":
        return [
          { label: "Matrículas", value: "24", trend: "+12%" },
          { label: "Pagamentos", value: "89%", trend: "+5%" },
          { label: "Documentos", value: "156", trend: "+18" }
        ];
      default:
        return [];
    }
  };

  const quickStats = getQuickStats();

  return (
    <div className="space-y-6">
      {/* Stats rápidas */}
      {quickStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ações Rápidas
            </div>
            {/* Botão de reset PIN (apenas para diretor e secretário) */}
            {['diretor', 'secretario'].includes(userType) && (
              <AdminPINResetButton />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((action) => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
          
          {actions.length === 0 && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma ação rápida disponível para seu perfil.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Manager */}
      <QuickActionsManager 
        activeAction={activeAction}
        onClose={() => setActiveAction(null)}
        onSuccess={() => {
          toast({
            title: "Ação concluída com sucesso!",
            description: "A operação foi realizada com sucesso.",
          });
        }}
      />
    </div>
  );
}
