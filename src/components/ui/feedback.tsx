import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";

export const feedback = {
  success: (message: string, description?: string) => {
    toast({
      title: "Sucesso",
      description: description || message,
      className: "border-green-200 bg-green-50 text-green-900",
    });
  },

  error: (message: string, description?: string) => {
    toast({
      title: "Erro",
      description: description || message,
      variant: "destructive",
    });
  },

  warning: (message: string, description?: string) => {
    toast({
      title: "Atenção",
      description: description || message,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    });
  },

  info: (message: string, description?: string) => {
    toast({
      title: "Informação",
      description: description || message,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    });
  },
};