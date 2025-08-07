import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Users, Settings, DollarSign, BarChart3, GraduationCap, UserCheck } from "lucide-react";

export function PermissionExamples() {
  const { 
    user, 
    isDirector, 
    isCoordinator, 
    isSecretary, 
    isProfessor, 
    isAdmin, 
    hasPermission 
  } = usePermissions();

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Exemplo de Sistema de Permissões</h2>
        <p className="text-muted-foreground">
          Logado como: <Badge variant="outline">{user?.full_name}</Badge> 
          - Perfil: <Badge>{user?.role}</Badge>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Gestão de Usuários - Apenas Diretores e Coordenadores */}
        <PermissionGuard roles={['diretor', 'coordenador']}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gerenciar alunos, professores e funcionários
              </p>
              <Button className="w-full">Acessar</Button>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Configurações do Sistema - Apenas Diretores */}
        <PermissionGuard roles={['diretor']}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configurações avançadas do sistema
              </p>
              <Button className="w-full">Configurar</Button>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Gestão Financeira - Diretores, Coordenadores e Secretários */}
        <PermissionGuard permissions={['canManageFinances']}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gestão de mensalidades e pagamentos
              </p>
              <Button className="w-full">Gerenciar</Button>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Relatórios - Vários perfis */}
        <PermissionGuard permissions={['canViewReports']}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Relatórios e análises do sistema
              </p>
              <Button className="w-full">Ver Relatórios</Button>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Gestão de Aulas - Professores e Administradores */}
        <PermissionGuard permissions={['canManageClasses']}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Gestão de Aulas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Criar e gerenciar turmas e aulas
              </p>
              <Button className="w-full">Gerenciar Aulas</Button>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Controle de Frequência - Com fallback customizado */}
        <PermissionGuard 
          permissions={['canManageAttendance']}
          fallback={
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Controle de Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Acesso restrito ao seu perfil
                </p>
                <Button disabled className="w-full">Sem Acesso</Button>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Controle de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Registrar presença e ausências
              </p>
              <Button className="w-full">Controlar Frequência</Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>

      {/* Informações de Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Permissão (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>É Diretor:</strong> {isDirector() ? '✅' : '❌'}
            </div>
            <div>
              <strong>É Coordenador:</strong> {isCoordinator() ? '✅' : '❌'}
            </div>
            <div>
              <strong>É Secretário:</strong> {isSecretary() ? '✅' : '❌'}
            </div>
            <div>
              <strong>É Professor:</strong> {isProfessor() ? '✅' : '❌'}
            </div>
            <div>
              <strong>É Admin:</strong> {isAdmin() ? '✅' : '❌'}
            </div>
            <div>
              <strong>Pode gerenciar usuários:</strong> {hasPermission('canManageUsers') ? '✅' : '❌'}
            </div>
            <div>
              <strong>Pode ver relatórios:</strong> {hasPermission('canViewReports') ? '✅' : '❌'}
            </div>
            <div>
              <strong>Pode gerenciar finanças:</strong> {hasPermission('canManageFinances') ? '✅' : '❌'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}