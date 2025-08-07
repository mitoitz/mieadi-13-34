import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Search, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TroubleshootResult {
  success: boolean;
  data?: any;
  suggestion?: string;
  error?: string;
}

export function FunctionTroubleshoot() {
  const [functionName, setFunctionName] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [results, setResults] = useState<Record<string, TroubleshootResult>>({});
  const [loading, setLoading] = useState(false);

  const runTroubleshoot = async (action: string) => {
    if (!functionName.trim()) {
      toast.error('Digite o nome da função');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('function-troubleshoot', {
        body: {
          functionName: functionName.trim(),
          procedureName: procedureName.trim() || undefined,
          action
        }
      });

      if (error) {
        throw error;
      }

      setResults(prev => ({
        ...prev,
        [action]: data
      }));

      if (data.success) {
        toast.success(`Verificação '${action}' concluída`);
      } else {
        toast.error(data.error || 'Erro na verificação');
      }
    } catch (error) {
      console.error('Error in troubleshoot:', error);
      toast.error('Erro ao executar diagnóstico');
      setResults(prev => ({
        ...prev,
        [action]: { success: false, error: 'Erro de conexão' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllChecks = async () => {
    const actions = ['check_function', 'check_permissions', 'check_search_path', 'suggest_fix'];
    
    for (const action of actions) {
      await runTroubleshoot(action);
      // Pequeno delay entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const renderResult = (action: string, title: string) => {
    const result = results[action];
    if (!result) return null;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {title}
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.success ? "OK" : "Erro"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {result.data && (
            <div className="mb-2">
              <Label className="text-xs font-medium">Dados:</Label>
              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
          
          {result.suggestion && (
            <div className="mb-2">
              <Label className="text-xs font-medium">Sugestão:</Label>
              <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded mt-1 whitespace-pre-wrap">
                {result.suggestion}
              </div>
            </div>
          )}

          {result.error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
              <strong>Erro:</strong> {result.error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Diagnóstico de Funções PostgreSQL
          </CardTitle>
          <CardDescription>
            Ferramenta para diagnosticar problemas de visibilidade de funções em procedures Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="functionName">Nome da Função</Label>
            <Input
              id="functionName"
              placeholder="ex: fn_minha_funcao"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="procedureName">Nome da Procedure (opcional)</Label>
            <Input
              id="procedureName"
              placeholder="ex: minha_procedure"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => runTroubleshoot('check_function')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Search className="h-4 w-4 mr-1" />
              Verificar Função
            </Button>
            
            <Button 
              onClick={() => runTroubleshoot('check_permissions')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Verificar Permissões
            </Button>
            
            <Button 
              onClick={() => runTroubleshoot('check_search_path')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Verificar Search Path
            </Button>
            
            <Button 
              onClick={() => runTroubleshoot('suggest_fix')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Sugerir Correção
            </Button>
            
            <Button 
              onClick={runAllChecks}
              disabled={loading}
              className="ml-auto"
            >
              {loading ? 'Diagnosticando...' : 'Executar Diagnóstico Completo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-2">
        {renderResult('check_function', 'Existência da Função')}
        {renderResult('check_permissions', 'Permissões de Execução')}
        {renderResult('check_search_path', 'Search Path')}
        {renderResult('suggest_fix', 'Sugestões de Correção')}
      </div>
    </div>
  );
}