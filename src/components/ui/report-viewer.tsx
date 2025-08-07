import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Printer, Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface ReportViewerProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  reportType?: string;
}

interface ReportActionsProps {
  reportTitle: string;
  onView: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

const ReportContent = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} className="p-6 bg-white text-black print:shadow-none">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      {children}
    </div>
  )
);

ReportContent.displayName = "ReportContent";

export function ReportViewer({ title, isOpen, onClose, children, reportType }: ReportViewerProps) {
  const handlePrint = () => {
    window.print();
    toast.success("Comando de impressão enviado");
  };

  const handleDownload = () => {
    // Em um ambiente real, aqui seria implementada a lógica de download
    toast.info("Download do relatório em desenvolvimento");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4 no-print">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-120px)] print-container">
          <ReportContent>
            <div className="mb-6 text-center border-b pb-4">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-muted-foreground">
                Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            {children}
          </ReportContent>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReportActions({ reportTitle, onView, onPrint, onDownload, className = "" }: ReportActionsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      toast.info("Abra a visualização do relatório para imprimir");
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      toast.info("Download em desenvolvimento");
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button onClick={onView} variant="default" size="sm">
        <Eye className="h-4 w-4 mr-2" />
        Visualizar
      </Button>
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir
      </Button>
      <Button onClick={handleDownload} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );
}

export function ReportPreviewCard({ 
  title, 
  description, 
  icon: Icon, 
  onView,
  onPrint,
  onDownload,
  className = "" 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onView: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}) {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ReportActions 
          reportTitle={title}
          onView={onView}
          onPrint={onPrint}
          onDownload={onDownload}
        />
      </CardContent>
    </Card>
  );
}