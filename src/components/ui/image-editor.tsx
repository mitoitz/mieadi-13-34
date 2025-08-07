import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { RotateCw, RotateCcw, Crop, Move, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
  imageFile: File | null;
}

interface ImageTransform {
  scale: number;
  rotation: number;
  x: number;
  y: number;
}

export function ImageEditor({ isOpen, onClose, onSave, imageFile }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<ImageTransform>({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'move' | 'crop'>('move');

  useEffect(() => {
    if (isOpen && imageFile) {
      loadImage();
    }
  }, [isOpen, imageFile]);

  useEffect(() => {
    if (image) {
      drawImage();
    }
  }, [image, transform]);

  const loadImage = () => {
    if (!imageFile) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Reset transform when loading new image
      setTransform({
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0
      });
    };
    img.src = URL.createObjectURL(imageFile);
  };

  const drawImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (fixed size for editing)
    canvas.width = 400;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply transformations
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(transform.x, transform.y);

    // Calculate image size to fit canvas while maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;

    if (aspectRatio > 1) {
      drawHeight = drawWidth / aspectRatio;
    } else {
      drawWidth = drawHeight * aspectRatio;
    }

    // Draw image centered
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // Restore context
    ctx.restore();

    // Draw crop overlay if in crop mode
    if (mode === 'crop') {
      drawCropOverlay(ctx, canvas);
    }
  };

  const drawCropOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const cropSize = 200; // Fixed crop size
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Darken the area outside the crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear the crop area
    ctx.clearRect(
      centerX - cropSize / 2,
      centerY - cropSize / 2,
      cropSize,
      cropSize
    );

    // Draw crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - cropSize / 2,
      centerY - cropSize / 2,
      cropSize,
      cropSize
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'move') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mode === 'move') {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    setTransform(prev => ({ ...prev, scale: value[0] }));
  };

  const handleRotation = (direction: 'left' | 'right') => {
    const rotationStep = 90;
    setTransform(prev => ({
      ...prev,
      rotation: prev.rotation + (direction === 'right' ? rotationStep : -rotationStep)
    }));
  };

  const resetTransform = () => {
    setTransform({
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0
    });
  };

  const handleSave = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Create a new canvas for the final image
    const finalCanvas = document.createElement('canvas');
    const finalSize = 300; // Final image size
    finalCanvas.width = finalSize;
    finalCanvas.height = finalSize;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (!finalCtx || !image) return;

    // Draw the transformed image to the final canvas
    finalCtx.save();
    finalCtx.translate(finalSize / 2, finalSize / 2);
    finalCtx.rotate((transform.rotation * Math.PI) / 180);
    finalCtx.scale(transform.scale, transform.scale);
    finalCtx.translate(transform.x / 2, transform.y / 2);

    const aspectRatio = image.width / image.height;
    let drawWidth = finalSize;
    let drawHeight = finalSize;

    if (aspectRatio > 1) {
      drawHeight = drawWidth / aspectRatio;
    } else {
      drawWidth = drawHeight * aspectRatio;
    }

    finalCtx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    
    finalCtx.restore();

    // Convert to blob and create file
    finalCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `edited-image-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        onSave(file);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-border rounded-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center gap-2">
            <Button
              variant={mode === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('move')}
              className="flex items-center gap-2"
            >
              <Move className="h-4 w-4" />
              Mover
            </Button>
            <Button
              variant={mode === 'crop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('crop')}
              className="flex items-center gap-2"
            >
              <Crop className="h-4 w-4" />
              Crop
            </Button>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Scale Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={[transform.scale]}
                  onValueChange={handleScaleChange}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Rotação</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotation('left')}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotation('right')}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={resetTransform}>
              Resetar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button variant="hero" onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}