import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Wifi, WifiOff, CheckCircle, XCircle } from "lucide-react";

interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
}

export default function ConfiguracaoAPI() {
  const [config, setConfig] = useState<APIConfig>({
    baseURL: "http://localhost:5000",
    timeout: 5000,
    retryAttempts: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'disconnected' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('api-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const testConnection = async (url: string) => {
    try {
      setConnectionStatus('testing');
      console.log(`🔄 Testando conexão com: ${url}/api/status`);
      
      // Detectar se estamos em HTTPS tentando acessar HTTP (Mixed Content)
      const isHttps = window.location.protocol === 'https:';
      const isHttpUrl = url.startsWith('http://');
      
      if (isHttps && isHttpUrl) {
        console.log('⚠️ Mixed Content detectado - tentando soluções alternativas...');
        
        // Tentativa 1: Converter para HTTPS
        const httpsUrl = url.replace('http://', 'https://');
        console.log(`🔐 Tentando HTTPS: ${httpsUrl}/api/status`);
        
        try {
          const httpsResponse = await fetch(`${httpsUrl}/api/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(config.timeout)
          });
          
          if (httpsResponse.ok) {
            const data = await httpsResponse.json();
            console.log(`✅ HTTPS funcionou! Dados:`, data);
            setConnectionStatus('connected');
            // Atualizar a URL para HTTPS
            setConfig(prev => ({ ...prev, baseURL: httpsUrl }));
            return { success: true, data };
          }
        } catch (httpsError) {
          console.log(`❌ HTTPS falhou:`, httpsError);
        }
        
        // Tentativa 2: Usar proxy CORS
        console.log('🌐 Tentando via proxy CORS...');
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url + '/api/status')}`;
          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(config.timeout * 2)
          });
          
          if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            console.log(`✅ Proxy funcionou! Dados:`, data);
            setConnectionStatus('connected');
            return { success: true, data };
          }
        } catch (proxyError) {
          console.log(`❌ Proxy falhou:`, proxyError);
        }
        
        // Se chegou aqui, é Mixed Content mesmo
        setConnectionStatus('disconnected');
        return { 
          success: false, 
          error: `Mixed Content bloqueado. Soluções:
          1) Configure HTTPS na API local
          2) Use ngrok ou similar para túnel HTTPS
          3) Permita conteúdo misto no navegador
          4) Execute o sistema em HTTP também` 
        };
      }
      
      // Tentativa normal (HTTP para HTTP ou HTTPS para HTTPS)
      const response = await fetch(`${url}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        mode: 'cors',
        signal: AbortSignal.timeout(config.timeout)
      });

      console.log(`📡 Resposta da API:`, response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Dados recebidos:`, data);
        setConnectionStatus('connected');
        return { success: true, data };
      } else {
        setConnectionStatus('disconnected');
        console.log(`❌ Erro HTTP:`, response.status, response.statusText);
        return { success: false, error: `HTTP ${response.status} - ${response.statusText}` };
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.log(`❌ Erro de conexão:`, error);
      
      // Analisar o tipo de erro para dar feedback melhor
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            error: 'Erro de conexão - verifique se a API está rodando e acessível' 
          };
        }
        if (error.name === 'AbortError') {
          return { success: false, error: 'Timeout - API não respondeu a tempo' };
        }
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Testar conexão antes de salvar
    const testResult = await testConnection(config.baseURL);
    
    if (testResult.success) {
      localStorage.setItem('api-config', JSON.stringify(config));
      toast({
        title: "Configuração salva!",
        description: "API conectada com sucesso.",
      });
    } else {
      toast({
        title: "Erro de conexão",
        description: `Não foi possível conectar: ${testResult.error}`,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleTest = async () => {
    const result = await testConnection(config.baseURL);
    
    if (result.success) {
      toast({
        title: "Conexão bem-sucedida!",
        description: "API está respondendo corretamente.",
      });
    } else {
      toast({
        title: "Falha na conexão",
        description: `Erro: ${result.error}`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Wifi className="h-4 w-4 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge variant="secondary">Testando...</Badge>;
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Conectado</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      default:
        return <Badge variant="outline">Não testado</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuração da API Local</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Configurações de Conexão
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
            </CardTitle>
            <CardDescription>
              Configure o endereço da API local para biometria e hardware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseURL">URL Base da API</Label>
              <Input
                id="baseURL"
                value={config.baseURL}
                onChange={(e) => setConfig(prev => ({ ...prev, baseURL: e.target.value }))}
                placeholder="http://192.168.1.100:5000"
              />
              <p className="text-sm text-muted-foreground">
                Exemplo: http://192.168.2.120:5000 ou http://localhost:5000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout}
                  onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  min="1000"
                  max="30000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Tentativas</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={config.retryAttempts}
                  onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                onClick={handleTest} 
                variant="outline"
                disabled={isLoading}
              >
                Testar Conexão
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções de Instalação</CardTitle>
            <CardDescription>
              Como configurar e executar a API local
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>1.</strong> Baixe os arquivos da API na pasta <code>hardware-api/</code></p>
              <p><strong>2.</strong> Execute o arquivo <code>install.bat</code> para instalar as dependências</p>
              <p><strong>3.</strong> Execute o arquivo <code>start.bat</code> para iniciar a API</p>
              <p><strong>4.</strong> A API estará disponível em <code>http://localhost:5000</code></p>
              <p><strong>5.</strong> Se estiver em rede, use o IP da máquina: <code>http://192.168.x.x:5000</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}