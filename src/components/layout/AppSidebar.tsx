import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Settings, 
  FileText, 
  Bell,
  UserCheck,
  Building,
  MapPin,
  School,
  ClipboardList,
  UserPlus,
  ChevronRight,
  CalendarDays,
  Wrench
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  userType: string;
}

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/", roles: ["diretor", "aluno", "pastor", "professor", "coordenador", "secretario", "membro"] },
  { icon: Users, label: "Pessoas", path: "/pessoas", roles: ["diretor", "coordenador", "secretario"] },
  { icon: Building, label: "Congregações", path: "/congregacoes", roles: ["diretor", "coordenador"] },
  { icon: MapPin, label: "Campos", path: "/campos", roles: ["diretor", "coordenador"] },
  { icon: CalendarDays, label: "Eventos", path: "/eventos", roles: ["diretor", "coordenador", "secretario", "pastor"] },
  { icon: School, label: "Cursos", path: "/cursos", roles: ["diretor", "coordenador"] },
  { icon: BookOpen, label: "Disciplinas", path: "/disciplinas", roles: ["diretor", "coordenador", "professor"] },
  { icon: GraduationCap, label: "Turmas", path: "/turmas", roles: ["diretor", "coordenador", "professor"] },
  { icon: ClipboardList, label: "Matrículas", path: "/matriculas", roles: ["diretor", "coordenador", "secretario"] },
  { icon: UserCheck, label: "Controle de Presença", path: "/frequencia", roles: ["diretor", "coordenador", "professor", "secretario"] },
  { icon: DollarSign, label: "Recibos", path: "/frequencia-recibos", roles: ["diretor", "coordenador", "secretario"] },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro", roles: ["diretor", "coordenador", "secretario"] },
  { icon: Bell, label: "Notificações", path: "/notificacoes", roles: ["diretor", "aluno", "pastor", "professor", "coordenador", "secretario", "membro"] },
  { icon: FileText, label: "Relatórios", path: "/relatorios", roles: ["diretor", "coordenador", "secretario"] },
  { icon: UserPlus, label: "Solicitações", path: "/solicitacoes-membros", roles: ["diretor", "coordenador", "secretario"] },
  { icon: Wrench, label: "Utilitários", path: "/utilitarios", roles: ["diretor"] },
  { icon: Settings, label: "Config. API", path: "/configuracao-api", roles: ["diretor"] },
  { icon: Settings, label: "Configurações", path: "/configuracoes", roles: ["diretor"] },
];

export function AppSidebar({ userType }: AppSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const currentPath = location.pathname;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userType)
  );

  // Organize items by groups
  const mainItems = filteredMenuItems.filter(item => 
    ["/", "/pessoas", "/congregacoes", "/campos", "/eventos"].includes(item.path)
  );
  
  const academicItems = filteredMenuItems.filter(item => 
    ["/cursos", "/disciplinas", "/turmas", "/matriculas", "/frequencia"].includes(item.path)
  );
  
  const managementItems = filteredMenuItems.filter(item => 
    ["/financeiro", "/relatorios", "/solicitacoes-membros"].includes(item.path)
  );
  
  const systemItems = filteredMenuItems.filter(item => 
    ["/notificacoes", "/utilitarios", "/configuracao-api", "/configuracoes"].includes(item.path)
  );

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive(item.path)}>
                      <Link to={item.path}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Acadêmico */}
        {academicItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Acadêmico</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {academicItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Gestão */}
        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sistema */}
        {systemItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}