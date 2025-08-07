import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Settings, User, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MieadiLogo } from "@/components/ui/mieadi-logo";

interface HeaderProps {
  user: {
    name: string;
    userType: "diretor" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";
    congregacao?: string;
  };
  onLogout: () => void;
  onMenuToggle: () => void;
}

export function Header({ user, onLogout, onMenuToggle }: HeaderProps) {
  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case "diretor":
        return "Diretor";
      case "pastor":
        return "Pastor";
      case "aluno":
        return "Aluno";
      default:
        return type;
    }
  };

  const getUserTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "diretor":
        return "default";
      case "pastor":
        return "secondary";
      case "aluno":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-elegant animate-fade-in-down">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Menu móvel e Logo */}
          <div className="flex items-center gap-3">
            {/* Botão do menu móvel */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden hover-lift"
              onClick={onMenuToggle}
              data-sidebar-trigger
            >
              <Menu className="h-5 w-5 transition-transform duration-200" />
            </Button>
            
            <MieadiLogo size="md" showText className="hover-lift" />
          </div>

          {/* Ações do usuário */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Notificações */}
            <NotificationBell />
            
            {/* Toggle do tema */}
            <ThemeToggle />

            {/* Menu do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 lg:gap-3 h-auto p-2 hover-lift group">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium truncate max-w-[120px] lg:max-w-none group-hover:text-primary transition-colors">{user.name}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant={getUserTypeBadgeVariant(user.userType)} className="text-xs transition-all duration-300 group-hover:scale-105">
                        {getUserTypeLabel(user.userType)}
                      </Badge>
                    </div>
                    {user.congregacao && (
                      <p className="text-xs text-muted-foreground truncate max-w-[120px] lg:max-w-none">
                        {user.congregacao}
                      </p>
                    )}
                  </div>
                  <Avatar className="h-8 lg:h-10 w-8 lg:w-10 hover-glow transition-all duration-300 group-hover:scale-110">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs lg:text-sm font-bold">
                      {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-effect animate-fade-in-up">
                <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout} 
                  className="text-destructive hover:bg-destructive/10 transition-colors duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}