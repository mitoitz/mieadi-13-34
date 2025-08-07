import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface Props {
  error: Error;
  resetErrorBoundary: () => void;
}

export function EnhancedErrorBoundary({ error, resetErrorBoundary }: Props) {
  return (
    <Card className="p-6 max-w-lg mx-auto mt-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Ocorreu um erro</h3>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={resetErrorBoundary}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </Card>
  );
}