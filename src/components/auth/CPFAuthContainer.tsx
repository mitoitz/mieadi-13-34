import { useState } from "react";
import { CPFLoginForm } from "./CPFLoginForm";
import { PINSetupForm } from "./PINSetupForm";
import { PINLoginForm } from "./PINLoginForm";


type AuthStep = 'cpf' | 'pin-setup' | 'pin-login';

interface CPFAuthContainerProps {
  onLogin: (user: any) => void;
}

export function CPFAuthContainer({ onLogin }: CPFAuthContainerProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('cpf');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleUserFound = (user: any) => {
    setCurrentUser(user);
    if (user.has_pin) {
      setCurrentStep('pin-login');
    } else {
      // Se não tem PIN, dar opção de configurar
      setCurrentStep('pin-setup');
    }
  };

  const handlePINSetup = (user: any) => {
    setCurrentUser(user);
    // Após configurar PIN, ir para login
    setCurrentStep('pin-login');
  };

  const handleSetupPINFromLogin = () => {
    setCurrentStep('pin-setup');
  };

  const handlePINVerified = (user: any) => {
    setCurrentUser(user);
    completeLogin(user);
  };


  const completeLogin = (user: any) => {
    // Preparar dados para o contexto de autenticação
    const userData = {
      id: user.id,
      name: user.full_name,
      full_name: user.full_name,
      email: user.email || '',
      cpf: user.cpf,
      userType: user.role,
      role: user.role,
      congregacao: user.congregation_id,
      congregation_id: user.congregation_id,
      permissions: {},
      session: { user },
      photo_url: user.photo_url,
      tela_permitida: user.tela_permitida,
      can_edit: user.can_edit,
      two_factor_enabled: user.two_factor_enabled
    };

    onLogin(userData);
  };

  const handleBack = () => {
    setCurrentStep('cpf');
    setCurrentUser(null);
  };

  return (
    <>
      {currentStep === 'cpf' && (
        <CPFLoginForm onUserFound={handleUserFound} />
      )}
      
      {currentStep === 'pin-setup' && currentUser && (
        <PINSetupForm 
          user={currentUser} 
          onPINSetup={handlePINSetup} 
        />
      )}
      
      {currentStep === 'pin-login' && currentUser && (
        <PINLoginForm 
          user={currentUser} 
          onPINVerified={handlePINVerified}
          onBack={handleBack}
          onSetupPIN={!currentUser.has_pin ? handleSetupPINFromLogin : undefined}
        />
      )}
      
    </>
  );
}