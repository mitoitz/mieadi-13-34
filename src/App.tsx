import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { AuthenticatedRoutes } from "@/components/routes/AuthenticatedRoutes";
import { UnauthenticatedRoutes } from "@/components/routes/UnauthenticatedRoutes";
import { CPFAuthContainer } from "@/components/auth/CPFAuthContainer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingBoundary } from "@/components/ui/loading-boundary";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { SystemSetup } from "@/components/setup/SystemSetup";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
// Importar para configurar interceptor automaticamente
import "@/lib/supabase-context";
// Importar função de teste para debug (remover em produção)
import "@/utils/test-pin-setup";

const App = () => {
  const { isAuthenticated, user, loading, handleLogin, handleLogout } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // Verificar se o sistema precisa de configuração inicial
    const checkSystemSetup = async () => {
      console.log('🔄 Verificando configuração do sistema...');
      try {
        const { data, error } = await supabase.rpc('system_needs_setup');

        if (error) {
          console.error('❌ Erro ao verificar configuração:', error);
          setNeedsSetup(false);
        } else {
          console.log('✅ Resultado system_needs_setup:', data);
          setNeedsSetup(data || false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar configuração:', error);
        setNeedsSetup(false);
      } finally {
        console.log('✅ Configuração verificada, definindo checkingSetup como false');
        setCheckingSetup(false);
      }
    };

    checkSystemSetup();
  }, []); // Executar apenas uma vez na montagem

  console.log('🔍 Estado atual do App (updated):', {
    isAuthenticated,
    hasUser: !!user,
    userType: user?.userType,
    loading,
    needsSetup,
    checkingSetup
  });

  if (loading || checkingSetup) {
    console.log('⏳ App está carregando...');
    return <LoadingSpinner size="lg" text="Inicializando sistema..." />;
  }

  if (needsSetup) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system" storageKey="mieadi-ui-theme">
          <QueryProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SystemSetup onComplete={() => setNeedsSetup(false)} />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="mieadi-ui-theme">
        <QueryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LoadingBoundary>
                {isAuthenticated && user ? (
                  <AuthenticatedRoutes user={user} onLogout={handleLogout} />
                ) : (
                  <CPFAuthContainer onLogin={handleLogin} />
                )}
              </LoadingBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
