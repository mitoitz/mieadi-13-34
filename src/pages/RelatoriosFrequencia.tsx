import React from 'react';
import { AttendanceReports } from '@/components/reports/AttendanceReports';
import { PageHeader } from '@/components/ui/page-header';

export default function RelatoriosFrequencia() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Relatórios de Frequência"
        description="Análise completa e visual dos dados de frequência"
      />
      <div className="container mx-auto px-4 py-6">
        <AttendanceReports />
      </div>
    </div>
  );
}