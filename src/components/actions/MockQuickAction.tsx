import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface MockQuickActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  actionTitle: string;
}

export function MockQuickAction({ isOpen, onClose, onSuccess, actionTitle }: MockQuickActionProps) {
  const { toast } = useToast();

  const handleMockAction = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `A ação "${actionTitle}" será implementada em breve.`,
    });
    
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Funcionalidade em Desenvolvimento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            A funcionalidade "{actionTitle}" está sendo desenvolvida e será disponibilizada em breve.
          </p>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleMockAction} className="flex-1">
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}