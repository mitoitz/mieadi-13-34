import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield } from "lucide-react";
import { AdminPINResetForm } from "../auth/AdminPINResetForm";
import { useAuth } from "@/hooks/useAuth";

export function AdminPINResetButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Verificar se o usuário tem permissão para resetar PINs
  if (!user || !['diretor', 'secretario'].includes(user.role)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-gradient-to-r from-accent to-destructive text-white border-none hover:opacity-90"
        >
          <Shield className="h-4 w-4 mr-2" />
          Redefinir PIN
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Redefinir PIN de Usuário
          </DialogTitle>
        </DialogHeader>
        <AdminPINResetForm 
          adminUserId={user.id} 
          adminRole={user.role}
        />
      </DialogContent>
    </Dialog>
  );
}