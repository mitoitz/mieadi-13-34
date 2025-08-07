import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

interface ModernLayoutProps {
  user: {
    name: string;
    userType: "diretor" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";
    congregacao?: string;
  };
  onLogout: () => void;
  children: ReactNode;
}

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/pessoas": "Pessoas",
  "/congregacoes": "Congregações",
  "/campos": "Campos",
  "/cursos": "Cursos",
  "/disciplinas": "Disciplinas",
  "/turmas": "Turmas",
  "/matriculas": "Matrículas",
  "/frequencia": "Frequência",
  "/financeiro": "Financeiro",
  "/notificacoes": "Notificações",
  "/relatorios": "Relatórios",
  "/solicitacoes-membros": "Solicitações",
  "/configuracoes": "Configurações",
};

export function ModernLayout({ user, onLogout, children }: ModernLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentLabel = routeLabels[currentPath] || "Página";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userType={user.userType} />
        <SidebarInset className="flex-1">
          {/* Header com trigger da sidebar */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">MIEADI</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentPath !== "/" && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            
            {/* Área do usuário no header */}
            <div className="ml-auto flex items-center gap-2">
              <Header 
                user={user} 
                onLogout={onLogout} 
                onMenuToggle={() => {}} // Não usado no novo layout
              />
            </div>
          </header>

          {/* Conteúdo principal */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}