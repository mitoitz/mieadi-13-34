import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export function QRCodeGenerator({
  value,
  size = 200,
  level = "M",
  includeMargin = true,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  className = ""
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          errorCorrectionLevel: level,
          margin: includeMargin ? 1 : 0,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [value, size, level, includeMargin, bgColor, fgColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`border border-border rounded-lg ${className}`}
    />
  );
}