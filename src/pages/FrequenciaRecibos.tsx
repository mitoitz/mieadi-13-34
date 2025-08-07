import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Printer, 
  Search, 
  Clock, 
  TrendingUp,
  FileText,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { ReceiptGenerator } from '@/components/frequencia/ReceiptGenerator';
import { useAdvancedReceipts } from '@/hooks/useAdvancedReceipts';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  event_id?: string;
  status: string;
  check_in_time: string;
  check_out_time?: string;
  profiles: {
    full_name: string;
    badge_number: string;
  };
  classes?: {
    name: string;
    subjects?: {
      name: string;
    };
  };
  events?: {
    title: string;
  };
}

interface ReceiptRecord {
  id: string;
  receipt_number: string;
  student_id: string;
  attendance_record_id: string;
  status: string;
  created_at: string;
  print_method: string;
  receipt_data: any;
}

export default function FrequenciaRecibos() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  const { getTemplates, printThermal, loading } = useAdvancedReceipts();

  useEffect(() => {
    loadAttendanceRecords();
    loadRecentReceipts();
  }, []);

  const loadAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          student_id,
          class_id,
          event_id,
          status,
          check_in_time,
          check_out_time,
          profiles!attendance_records_student_id_fkey(full_name, badge_number),
          classes(name, subjects(name)),
          events(title)
        `)
        .order('check_in_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      // @ts-ignore - Temporary fix for missing types  
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros de frequência:', error);
    }
  };

  const loadRecentReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_receipts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentReceipts(data || []);
    } catch (error) {
      console.error('Erro ao carregar recibos:', error);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.profiles.badge_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.classes?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.events?.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleGenerateReceipt = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowGenerator(true);
  };

  const handlePrintReceipt = async (receiptId: string) => {
    try {
      await printThermal({
        receipt_id: receiptId,
        paper_size: '58mm',
        copies: 1,
      });
      loadRecentReceipts();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      presente: 'bg-green-100 text-green-800',
      ausente: 'bg-red-100 text-red-800',
      atrasado: 'bg-yellow-100 text-yellow-800',
      saida_antecipada: 'bg-orange-100 text-orange-800',
    };
    
    const labels = {
      presente: 'Presente',
      ausente: 'Ausente',
      atrasado: 'Atrasado',
      saida_antecipada: 'Saída Antecipada',
    };

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getReceiptStatusBadge = (status: string) => {
    const styles = {
      generated: 'bg-blue-100 text-blue-800',
      printed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      generated: 'Gerado',
      printed: 'Impresso',
      failed: 'Falha',
      cancelled: 'Cancelado',
    };

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR');
  };

  const stats = {
    totalRecords: attendanceRecords.length,
    totalReceipts: recentReceipts.length,
    printedReceipts: recentReceipts.filter(r => r.status === 'printed').length,
    todayRecords: attendanceRecords.filter(r => 
      new Date(r.check_in_time).toDateString() === new Date().toDateString()
    ).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Frequência e Recibos</h1>
          <p className="text-muted-foreground">
            Gestão completa de frequência e geração de comprovantes
          </p>
        </div>
        <Button onClick={() => setShowGenerator(true)}>
          <Receipt className="h-4 w-4 mr-2" />
          Novo Recibo
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{stats.todayRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recibos Gerados</p>
                <p className="text-2xl font-bold">{stats.totalReceipts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Impressos</p>
                <p className="text-2xl font-bold">{stats.printedReceipts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Registros de Frequência</TabsTrigger>
          <TabsTrigger value="receipts">Recibos Gerados</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por aluno, matrícula, turma ou evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="presente">Presente</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="saida_antecipada">Saída Antecipada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Registros */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Frequência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{record.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Matrícula: {record.profiles.badge_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {record.classes?.name || record.events?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(record.check_in_time)}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReceipt(record)}
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Gerar Recibo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recibos Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium font-mono">{receipt.receipt_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(receipt.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">{receipt.print_method?.toUpperCase()}</p>
                          {getReceiptStatusBadge(receipt.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {receipt.status !== 'printed' && receipt.print_method === 'thermal' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintReceipt(receipt.id)}
                          disabled={loading}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Imprimir
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gerenciar Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de gerenciamento de templates em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações de impressão e templates em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal do Gerador de Recibo */}
      {showGenerator && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gerar Recibo de Frequência</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGenerator(false);
                  setSelectedRecord(null);
                }}
              >
                ×
              </Button>
            </div>
            <ReceiptGenerator
              attendanceRecordId={selectedRecord.id}
              studentName={selectedRecord.profiles.full_name}
              activityName={selectedRecord.classes?.name || selectedRecord.events?.title}
              onGenerated={() => {
                loadRecentReceipts();
                setShowGenerator(false);
                setSelectedRecord(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Gerador Simples */}
      {showGenerator && !selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gerador de Recibo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGenerator(false)}
              >
                ×
              </Button>
            </div>
            <p className="text-muted-foreground">
              Selecione um registro de frequência para gerar o recibo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}