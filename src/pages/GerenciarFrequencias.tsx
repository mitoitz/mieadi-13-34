import React from 'react';
import { AttendanceManager } from '@/components/attendance/AttendanceManager';
import { PageHeader } from '@/components/ui/page-header';

export default function GerenciarFrequencias() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Gerenciar Frequências"
        description="Edite datas e turmas das frequências em lote"
      />
      <AttendanceManager />
    </div>
  );
}