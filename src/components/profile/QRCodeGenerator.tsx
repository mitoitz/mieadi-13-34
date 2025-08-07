import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, RefreshCw, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import { useAuth } from "@/hooks/useAuth";

export function QRCodeGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userQRCode, setUserQRCode] = useState<string>("");
  const { user } = useAuth();

  const generateQRCode = async () => {
    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }

    setIsGenerating(true);
    try {
      // Create QR code data with user information
      const qrData = JSON.stringify({
        id: user.id,
        name: user.name,
        cpf: user.cpf,
        type: "attendance",
        timestamp: new Date().toISOString()
      });

      // Generate QR code
      const url = await QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeUrl(url);
      setUserQRCode(qrData);
      toast.success("QR Code gerado com sucesso!");

    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error("Erro ao gerar QR Code");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${user?.name || 'user'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code baixado!");
  };

  const copyQRData = async () => {
    if (!userQRCode) return;

    try {
      await navigator.clipboard.writeText(userQRCode);
      toast.success("Dados do QR Code copiados!");
    } catch (error) {
      toast.error("Erro ao copiar dados");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Meu QR Code
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gere seu QR Code pessoal para controle de presença
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm">
            <div><strong>Nome:</strong> {user?.name || "Não informado"}</div>
            <div><strong>CPF:</strong> {user?.cpf || "Não informado"}</div>
            <div><strong>ID:</strong> {user?.id || "Não informado"}</div>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCodeUrl ? (
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-white rounded-lg border shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="QR Code do usuário" 
                className="w-64 h-64 mx-auto"
              />
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Badge variant="outline" className="text-green-700 border-green-200">
                QR Code ativo
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhum QR Code gerado ainda</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={generateQRCode} 
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            {qrCodeUrl ? "Gerar Novo" : "Gerar QR Code"}
          </Button>
          
          {qrCodeUrl && (
            <>
              <Button onClick={downloadQRCode} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button onClick={copyQRData} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">Como usar:</p>
          <ul className="space-y-1">
            <li>• Gere seu QR Code pessoal</li>
            <li>• Mostre o código na entrada dos eventos</li>
            <li>• O scanner lerá automaticamente seus dados</li>
            <li>• Sua presença será registrada instantaneamente</li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="text-xs text-blue-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-medium mb-1">Segurança:</p>
          <p>Seu QR Code contém apenas informações necessárias para identificação e está protegido por validação no sistema.</p>
        </div>
      </CardContent>
    </Card>
  );
}