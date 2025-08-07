import { LoginForm } from "./LoginForm";

interface AuthPageProps {
  onLogin: (profile: any) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  return <LoginForm onLogin={onLogin} />;
}