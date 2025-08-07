import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeGenerator } from '@/components/ui/qr-code-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, Download, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QRCodeManagerProps {
  userId: string;
  userQRCode?: string;
  onQRCodeGenerated?: (qrCode: string) => void;
}

export function QRCodeManager({ userId, userQRCode, onQRCodeGenerated }: QRCodeManagerProps) {
  const [qrCode, setQrCode] = useState<string>(userQRCode || '');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userQRCode) {
      setQrCode(userQRCode);
    }
  }, [userQRCode]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Generate simpler QR code format - just user ID with prefix
      const uniqueId = `MIEADI_USER_${userId}`;
      
      console.log('Gerando QR Code:', uniqueId);
      
      // Update user profile with QR code
      const { error } = await supabase
        .from('profiles')
        .update({ 
          qr_code: uniqueId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      }

      setQrCode(uniqueId);
      onQRCodeGenerated?.(uniqueId);

      toast({
        title: "QR Code gerado!",
        description: "Seu QR Code pessoal foi criado com sucesso",
      });

    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: error.message || "Não foi possível gerar o QR Code",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qrcode-mieadi-${userId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const copyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Código QR copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Meu QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <QRCodeGenerator 
                    value={qrCode} 
                    size={150} 
                    className="block"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRModal(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQRCode}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyQRCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={generateQRCode}
                disabled={isGenerating}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Gerar Novo QR Code
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Sem QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gere seu QR Code pessoal para marcação rápida de presença
              </p>
              <Button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Gerar QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Meu QR Code
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-lg border">
                <QRCodeGenerator 
                  value={qrCode} 
                  size={200} 
                  className="block"
                />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Código: {qrCode}</p>
              <p className="text-xs text-muted-foreground">
                Use este QR Code para marcar presença rapidamente
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadQRCode}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                variant="outline"
                onClick={copyQRCode}
                className="flex-1"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}