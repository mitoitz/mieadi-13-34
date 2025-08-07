import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

import { 
  Upload, 
  Camera, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (file: File) => void;
  title?: string;
  aspectRatio?: number; // width/height ratio
}

interface ImageState {
  file: File | null;
  url: string | null;
  scale: number;
  rotation: number;
  x: number;
  y: number;
}

export function ImageUploadEditor({ 
  isOpen, 
  onClose, 
  onImageSelected, 
  title = "Selecionar Imagem",
  aspectRatio = 1 
}: ImageUploadEditorProps) {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    url: null,
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0
  });
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageState({
        file,
        url,
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0
      });
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect(file);
    setShowCamera(false);
  };

  const resetImage = () => {
    setImageState({
      file: null,
      url: null,
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imageState.x,
      y: e.clientY - imageState.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setImageState(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const rotateImage = () => {
    setImageState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const processAndConfirm = async () => {
    if (!imageState.file || !canvasRef.current || !imageRef.current) return;

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size based on aspect ratio
      const size = 400;
      canvas.width = size;
      canvas.height = size / aspectRatio;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

      // Transform context
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageState.rotation * Math.PI) / 180);
      ctx.scale(imageState.scale, imageState.scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.translate(imageState.x, imageState.y);

      // Draw image
      const img = imageRef.current;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;

      if (imgAspect > aspectRatio) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspect;
      }

      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // Restore context
      ctx.restore();

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File(
            [blob], 
            `processed-${imageState.file?.name || 'image.jpg'}`, 
            { type: 'image/jpeg' }
          );
          onImageSelected(processedFile);
          toast({
            title: "Imagem processada!",
            description: "A imagem foi ajustada e está pronta para uso.",
          });
          onClose();
          resetImage();
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a imagem.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    resetImage();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!imageState.url ? (
              // Upload Selection
              <div className="flex justify-center">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent 
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold">Selecionar Arquivo</h3>
                      <p className="text-sm text-muted-foreground">
                        Escolha uma imagem do seu dispositivo
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Image Editor
              <div className="space-y-6">
                {/* Preview Area */}
                <div className="flex justify-center">
                  <div 
                    className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/20"
                    style={{
                      width: 400,
                      height: 400 / aspectRatio
                    }}
                  >
                    <div
                      className="absolute inset-0 cursor-move"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        ref={imageRef}
                        src={imageState.url}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          transform: `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale}) rotate(${imageState.rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Zoom */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Zoom: {Math.round(imageState.scale * 100)}%
                    </Label>
                    <Slider
                      value={[imageState.scale]}
                      onValueChange={([value]) => setImageState(prev => ({ ...prev, scale: value }))}
                      min={0.5}
                      max={3}
                      step={0.1}
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-2">
                    <Label>Rotação</Label>
                    <Button 
                      variant="outline" 
                      onClick={rotateImage}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Girar 90°
                    </Button>
                  </div>

                  {/* Reset */}
                  <div className="space-y-2">
                    <Label>Ajustes</Label>
                    <Button 
                      variant="outline" 
                      onClick={() => setImageState(prev => ({ ...prev, scale: 1, rotation: 0, x: 0, y: 0 }))}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resetar
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetImage} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Nova Imagem
                  </Button>
                  <Button 
                    onClick={processAndConfirm} 
                    disabled={isProcessing}
                    className="flex-1"
                    variant="hero"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>

    </>
  );
}