import { Routes, Route } from "react-router-dom";
import { CPFAuthContainer } from "@/components/auth/CPFAuthContainer";

interface UnauthenticatedRoutesProps {
  onLogin: (profile: any) => void;
}

export function UnauthenticatedRoutes({ onLogin }: UnauthenticatedRoutesProps) {
  return (
    <Routes>
      <Route 
        path="*" 
        element={<CPFAuthContainer onLogin={onLogin} />} 
      />
    </Routes>
  );
}