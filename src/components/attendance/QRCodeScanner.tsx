import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Camera, CameraOff, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import QrScanner from "qr-scanner";
import { useDebounce } from "@/hooks/useDebounce";

interface QRCodeScannerProps {
  onScanResult: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScanResult, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScan, setLastScan] = useState<string>("");
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());
  const [processingCode, setProcessingCode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce processing to avoid rapid duplicates
  const debouncedProcessingCode = useDebounce(processingCode, 500);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Process debounced QR code
  useEffect(() => {
    if (debouncedProcessingCode && !scannedCodes.has(debouncedProcessingCode)) {
      console.log('Processando QR Code:', debouncedProcessingCode);
      
      // Add to scanned codes set
      setScannedCodes(prev => new Set([...prev, debouncedProcessingCode]));
      setLastScan(debouncedProcessingCode);
      setScanCount(prev => prev + 1);
      
      // Call the result handler
      onScanResult(debouncedProcessingCode);
      toast.success(`✅ QR Code processado: ${debouncedProcessingCode}`);
      
      // Clear processing after success
      setProcessingCode(null);
      
      // Auto-clear from memory after 30 seconds to allow re-scanning if needed
      setTimeout(() => {
        setScannedCodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(debouncedProcessingCode);
          return newSet;
        });
      }, 30000);
    }
  }, [debouncedProcessingCode, scannedCodes, onScanResult]);

  const handleQRCodeDetected = useCallback((result: QrScanner.ScanResult) => {
    const currentTime = Date.now();
    const timeSinceLastScan = currentTime - lastScanTimeRef.current;
    
    // Prevent rapid scanning (minimum 800ms between scans)
    if (timeSinceLastScan < 800) {
      return;
    }
    
    const qrData = result.data.trim();
    
    // Check if we already processed this code recently
    if (scannedCodes.has(qrData)) {
      toast.info(`⚠️ QR Code já processado: ${qrData}`);
      return;
    }
    
    console.log('QR Code detectado:', qrData);
    lastScanTimeRef.current = currentTime;
    
    // Set for processing with debounce
    setProcessingCode(qrData);
    
    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Visual feedback for detection
    toast.loading(`🔍 Processando QR Code: ${qrData}`, {
      duration: 1000,
      id: `processing-${qrData}`
    });
    
  }, [scannedCodes]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      // Check if QR Scanner is supported
      if (!QrScanner.hasCamera()) {
        throw new Error("Câmera não disponível neste dispositivo");
      }

      setIsScanning(true);
      
      // Create QR Scanner instance with continuous scanning
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        handleQRCodeDetected,
        {
          onDecodeError: (error) => {
            // Silently handle decode errors (normal when no QR code is visible)
            console.debug('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
          maxScansPerSecond: 2, // Limit scan frequency
          returnDetailedScanResult: true
        }
      );

      await qrScannerRef.current.start();
      setHasPermission(true);
      toast.success("📷 Scanner QR Code ativado - Modo contínuo");
      
    } catch (error: any) {
      console.error('Erro ao iniciar scanner:', error);
      setIsScanning(false);
      setHasPermission(false);
      const errorMessage = error.name === 'NotAllowedError' 
        ? "Permissão de câmera negada. Ative a câmera nas configurações do navegador."
        : error.message || "Erro ao acessar a câmera";
      
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    toast.info("📷 Scanner QR Code desativado");
  };

  const clearHistory = () => {
    setScannedCodes(new Set());
    setLastScan("");
    setScanCount(0);
    toast.success("Histórico de QR Codes limpo");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scanner QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Video */}
        <div className="relative">
          <video
            ref={videoRef}
            className={`w-full h-64 bg-gray-900 rounded-lg object-cover ${
              isScanning ? 'block' : 'hidden'
            }`}
            playsInline
            muted
          />
          
          {!isScanning && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Clique em "Iniciar Scanner" para começar</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Iniciar Scanner Contínuo
            </Button>
          ) : (
            <>
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                <CameraOff className="h-4 w-4 mr-2" />
                Parar Scanner
              </Button>
              {scanCount > 0 && (
                <Button onClick={clearHistory} variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar ({scanCount})
                </Button>
              )}
            </>
          )}
        </div>

        {/* Scanning Status */}
        {isScanning && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">
                Modo contínuo ativo - Aguardando QR Codes
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {scanCount} processados
            </Badge>
          </div>
        )}

        {/* Permission Status */}
        {hasPermission !== null && (
          <div className="flex items-center gap-2">
            {hasPermission ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Câmera autorizada</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Câmera não autorizada</span>
              </>
            )}
          </div>
        )}

        {/* Last Scan Result */}
        {lastScan && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Último QR Code processado:</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {lastScan}
            </Badge>
          </div>
        )}

        {/* Scanned History Summary */}
        {scannedCodes.size > 0 && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                QR Codes únicos processados:
              </span>
              <Badge variant="secondary">{scannedCodes.size}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Os códigos são automaticamente liberados após 30 segundos
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-1">Scanner Contínuo - Como usar:</p>
          <ul className="space-y-1">
            <li>• ✅ Posicione QR Codes dentro do quadro da câmera</li>
            <li>• ✅ Cada código é processado apenas uma vez automaticamente</li>
            <li>• ✅ Scanner permanece ativo aguardando novos códigos</li>
            <li>• ✅ Códigos são liberados automaticamente após 30 segundos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}