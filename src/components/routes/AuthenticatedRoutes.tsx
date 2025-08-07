
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ModernLayout } from "@/components/layout/ModernLayout";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import type { User } from "@/hooks/useAuth";

// Lazy load das páginas - ajustando para named exports e default exports
const Dashboard = lazy(() => import("@/pages/Dashboard").then(module => ({ default: module.Dashboard })));
const Pessoas = lazy(() => import("@/pages/Pessoas").then(module => ({ default: module.Pessoas })));
const Congregacoes = lazy(() => import("@/pages/Congregacoes").then(module => ({ default: module.Congregacoes })));
const Campos = lazy(() => import("@/pages/Campos").then(module => ({ default: module.Campos })));
const Cursos = lazy(() => import("@/pages/Cursos").then(module => ({ default: module.Cursos })));
const Disciplinas = lazy(() => import("@/pages/Disciplinas").then(module => ({ default: module.Disciplinas })));
const Turmas = lazy(() => import("@/pages/Turmas").then(module => ({ default: module.Turmas })));
const Matriculas = lazy(() => import("@/pages/Matriculas"));
const Frequencia = lazy(() => import("@/pages/Frequencia").then(module => ({ default: module.Frequencia })));

const FrequenciaRecibos = lazy(() => import("@/pages/FrequenciaRecibos"));
const GerenciarFrequencias = lazy(() => import("@/pages/GerenciarFrequencias"));
const Financeiro = lazy(() => import("@/pages/Financeiro").then(module => ({ default: module.Financeiro })));
const Notificacoes = lazy(() => import("@/pages/Notificacoes").then(module => ({ default: module.Notificacoes })));
const Relatorios = lazy(() => import("@/pages/Relatorios").then(module => ({ default: module.Relatorios })));
const RelatoriosFrequencia = lazy(() => import("@/pages/RelatoriosFrequencia"));
const SolicitacoesMembros = lazy(() => import("@/pages/SolicitacoesMembros").then(module => ({ default: module.SolicitacoesMembros })));
const Eventos = lazy(() => import("@/pages/Eventos").then(module => ({ default: module.Eventos })));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const ConfiguracaoAPI = lazy(() => import("@/pages/ConfiguracaoAPI"));

const MeuPerfil = lazy(() => import("@/pages/MeuPerfil"));

// Páginas específicas por tipo de usuário
const AlunoDashboard = lazy(() => import("@/pages/aluno/AlunoDashboard").then(module => ({ default: module.AlunoDashboard })));
const ProfessorDashboard = lazy(() => import("@/pages/professor/ProfessorDashboard").then(module => ({ default: module.ProfessorDashboard })));
const CoordenadorDashboard = lazy(() => import("@/pages/coordenador/CoordenadorDashboard").then(module => ({ default: module.CoordenadorDashboard })));
const SecretarioDashboard = lazy(() => import("@/pages/secretario/SecretarioDashboard").then(module => ({ default: module.SecretarioDashboard })));
const PastorDashboard = lazy(() => import("@/pages/pastor/PastorDashboard").then(module => ({ default: module.PastorDashboard })));
const MembroDashboard = lazy(() => import("@/pages/membro/MembroDashboard").then(module => ({ default: module.MembroDashboard })));

// Exemplo de permissões
const PermissionExamples = lazy(() => import("@/components/examples/PermissionExamples").then(module => ({ default: module.PermissionExamples })));

interface AuthenticatedRoutesProps {
  user: User;
  onLogout: () => void;
}

const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner size="lg" text="Carregando página..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export function AuthenticatedRoutes({ user, onLogout }: AuthenticatedRoutesProps) {
  const getDashboardComponent = () => {
    switch (user.userType) {
      case 'aluno':
        return <AlunoDashboard user={user} />;
      case 'professor':
        return <ProfessorDashboard user={user} />;
      case 'coordenador':
        return <CoordenadorDashboard user={user} />;
      case 'secretario':
        return <SecretarioDashboard user={user} />;
      case 'pastor':
        return <PastorDashboard user={user} />;
      case 'membro':
        return <MembroDashboard user={user} />;
      default:
        return <Dashboard userType={user.userType} user={user} />;
    }
  };

  return (
    <ModernLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<PageSuspense>{getDashboardComponent()}</PageSuspense>} />
        
        {/* Rotas para Diretor e Coordenador */}
        {['diretor', 'coordenador'].includes(user.userType) && (
          <>
            <Route path="/pessoas" element={<PageSuspense><Pessoas /></PageSuspense>} />
            <Route path="/congregacoes" element={<PageSuspense><Congregacoes /></PageSuspense>} />
            <Route path="/campos" element={<PageSuspense><Campos /></PageSuspense>} />
            <Route path="/eventos" element={<PageSuspense><Eventos /></PageSuspense>} />
            <Route path="/cursos" element={<PageSuspense><Cursos /></PageSuspense>} />
            <Route path="/disciplinas" element={<PageSuspense><Disciplinas /></PageSuspense>} />
            <Route path="/turmas" element={<PageSuspense><Turmas /></PageSuspense>} />
            <Route path="/matriculas" element={<PageSuspense><Matriculas /></PageSuspense>} />
            <Route path="/frequencia" element={<PageSuspense><Frequencia /></PageSuspense>} />
            <Route path="/frequencia-recibos" element={<PageSuspense><FrequenciaRecibos /></PageSuspense>} />
            <Route path="/gerenciar-frequencias" element={<PageSuspense><GerenciarFrequencias /></PageSuspense>} />
            <Route path="/financeiro" element={<PageSuspense><Financeiro /></PageSuspense>} />
            <Route path="/relatorios" element={<PageSuspense><Relatorios /></PageSuspense>} />
            <Route path="/relatorios-frequencia" element={<PageSuspense><RelatoriosFrequencia /></PageSuspense>} />
            <Route path="/solicitacoes-membros" element={<PageSuspense><SolicitacoesMembros /></PageSuspense>} />
            <Route path="/configuracoes" element={<PageSuspense><Configuracoes /></PageSuspense>} />
          </>
        )}
        
        {/* Rotas exclusivas para Diretor */}
        {user.userType === 'diretor' && (
          <>
            <Route path="/configuracao-api" element={<PageSuspense><ConfiguracaoAPI /></PageSuspense>} />
          </>
        )}
        
        {/* Rotas para Secretário */}
        {['diretor', 'secretario'].includes(user.userType) && (
          <>
            <Route path="/pessoas" element={<PageSuspense><Pessoas /></PageSuspense>} />
            <Route path="/eventos" element={<PageSuspense><Eventos /></PageSuspense>} />
            <Route path="/matriculas" element={<PageSuspense><Matriculas /></PageSuspense>} />
            
            <Route path="/frequencia-recibos" element={<PageSuspense><FrequenciaRecibos /></PageSuspense>} />
            <Route path="/financeiro" element={<PageSuspense><Financeiro /></PageSuspense>} />
            <Route path="/relatorios" element={<PageSuspense><Relatorios /></PageSuspense>} />
            <Route path="/solicitacoes-membros" element={<PageSuspense><SolicitacoesMembros /></PageSuspense>} />
          </>
        )}
        
        {/* Rotas para Professor */}
        {['diretor', 'coordenador', 'professor'].includes(user.userType) && (
          <>
            <Route path="/disciplinas" element={<PageSuspense><Disciplinas /></PageSuspense>} />
            <Route path="/turmas" element={<PageSuspense><Turmas /></PageSuspense>} />
            <Route path="/frequencia" element={<PageSuspense><Frequencia /></PageSuspense>} />
          </>
        )}

        {/* Rotas para Pastor */}
        {['diretor', 'coordenador', 'pastor'].includes(user.userType) && (
          <>
            <Route path="/eventos" element={<PageSuspense><Eventos /></PageSuspense>} />
          </>
        )}
        
        {/* Rotas disponíveis para todos os usuários */}
        <Route path="/notificacoes" element={<PageSuspense><Notificacoes /></PageSuspense>} />
        <Route path="/meu-perfil" element={<PageSuspense><MeuPerfil /></PageSuspense>} />
        
        {/* Rota de exemplo para testar permissões */}
        <Route path="/permissoes" element={<PageSuspense><PermissionExamples /></PageSuspense>} />
        
        {/* Redirect para dashboard se rota não encontrada */}
        <Route path="*" element={<PageSuspense>{getDashboardComponent()}</PageSuspense>} />
      </Routes>
    </ModernLayout>
  );
}
