import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeGenerator } from '@/components/ui/qr-code-generator';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  Bell, 
  Check, 
  X, 
  MonitorSpeaker,
  Wifi,
  Camera
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

interface PWAInstallPromptProps {
  showOnLogin?: boolean;
}

export function PWAInstallPrompt({ showOnLogin = false }: PWAInstallPromptProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const { 
    isInstallable, 
    isInstalled, 
    notificationPermission,
    installApp, 
    requestNotificationPermission,
    generateQRCodeForInstall 
  } = usePWA();
  const { toast } = useToast();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast({
        title: "📱 App instalado!",
        description: "O MIEADI foi instalado como aplicativo no seu dispositivo",
        duration: 5000,
      });
      setShowDialog(false);
    }
  };

  const handleNotificationRequest = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      toast({
        title: "🔔 Notificações ativadas!",
        description: "Você receberá notificações de presença e outras atualizações",
      });
    } else {
      toast({
        title: "Notificações negadas",
        description: "Você pode ativar nas configurações do navegador depois",
        variant: "destructive"
      });
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button/Card */}
      {showOnLogin ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Instale o App MIEADI</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso rápido, notificações e funciona offline
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRCode(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                {isInstallable && (
                  <Button
                    size="sm"
                    onClick={handleInstall}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Instalar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Instalar App
        </Button>
      )}

      {/* Full Install Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instalar MIEADI como Aplicativo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Vantagens do App:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-1">
                      <Wifi className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm">Funciona offline</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-1">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm">Notificações push</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full p-1">
                      <Camera className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm">Acesso à câmera</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 rounded-full p-1">
                      <MonitorSpeaker className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm">Ícone na tela inicial</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">QR Code para Instalação:</h3>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <QRCodeGenerator 
                      value={generateQRCodeForInstall()} 
                      size={150} 
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Escaneie para abrir no celular
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Notificações</p>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas de presença e atualizações
                    </p>
                  </div>
                </div>
                {notificationPermission === 'granted' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Ativadas</span>
                  </div>
                ) : notificationPermission === 'denied' ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="h-4 w-4" />
                    <span className="text-sm">Negadas</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNotificationRequest}
                  >
                    Ativar
                  </Button>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Agora Não
                </Button>
                {isInstallable && (
                  <Button onClick={handleInstall}>
                    <Download className="h-4 w-4 mr-2" />
                    Instalar Aplicativo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Only Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code para Instalação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-lg border">
                <QRCodeGenerator 
                  value={generateQRCodeForInstall()} 
                  size={200} 
                />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="font-medium">MIEADI - Sistema de Gestão</p>
              <p className="text-sm text-muted-foreground">
                Escaneie com a câmera do seu celular para abrir e instalar o aplicativo
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Como instalar no celular:
              </h4>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. Escaneie o QR Code com a câmera</li>
                <li>2. Abra o link no navegador</li>
                <li>3. Toque em "Adicionar à tela inicial"</li>
                <li>4. Confirme a instalação</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}