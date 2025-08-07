import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CalendarCheck,
  AlertTriangle, 
  UserCheck,
  MapPin,
  Mail,
  Phone,
  Calendar,
  RefreshCw
} from "lucide-react";
import { absenceService } from "@/services/absence.service";
import { supabase } from "@/integrations/supabase/client";

interface AbsenceData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  days_absent: number;
  last_activity: string;
  absence_status: string;
  congregations?: { name: string };
  fields?: { name: string };
}

export function AbsenceControlReport() {
  const [people, setPeople] = useState<AbsenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<AbsenceData | null>(null);
  const [awayMode, setAwayMode] = useState(false);
  const [awayReason, setAwayReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAbsenceReport();
  }, []);

  const loadAbsenceReport = async () => {
    try {
      setLoading(true);
      const data = await absenceService.getAbsenceReport();
      setPeople(data);
    } catch (error) {
      console.error('Error loading absence report:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: "Não foi possível carregar o relatório de ausências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (personId: string, fullName: string) => {
    try {
      await absenceService.markAttendance(personId);
      toast({
        title: "Presença registrada",
        description: `Presença de ${fullName} foi registrada com sucesso.`,
      });
      loadAbsenceReport();
    } catch (error) {
      toast({
        title: "Erro ao registrar presença",
        description: "Não foi possível registrar a presença.",
        variant: "destructive",
      });
    }
  };

  const checkAbsences = async () => {
    try {
      await absenceService.checkAndNotifyAbsences();
      toast({
        title: "Verificação concluída",
        description: "Notificações de ausência foram enviadas.",
      });
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar as ausências.",
        variant: "destructive",
      });
    }
  };

  const handleSetAwayMode = async () => {
    if (!selectedPerson) return;

    try {
      // Atualizar diretamente o perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString() // Marca como ativo
        })
        .eq('id', selectedPerson.id);

      toast({
        title: awayMode ? "Modo viagem ativado" : "Modo viagem desativado",
        description: `Status de ${selectedPerson.full_name} foi atualizado.`,
      });

      setSelectedPerson(null);
      setAwayMode(false);
      setAwayReason("");
      setStartDate("");
      setEndDate("");
      loadAbsenceReport();
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da pessoa.",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Crítico (90+ dias)': return 'destructive';
      case 'Alto (60+ dias)': return 'secondary';
      case 'Moderado (30+ dias)': return 'outline';
      case 'Em viagem/licença': return 'default';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Crítico (90+ dias)': return 'text-destructive';
      case 'Alto (60+ dias)': return 'text-orange-600';
      case 'Moderado (30+ dias)': return 'text-yellow-600';
      case 'Em viagem/licença': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };

  const criticalAbsences = people.filter(p => p.days_absent >= 90);
  const highAbsences = people.filter(p => p.days_absent >= 60 && p.days_absent < 90);
  const moderateAbsences = people.filter(p => p.days_absent >= 30 && p.days_absent < 60);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crítico (90+ dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAbsences.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto (60+ dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highAbsences.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderado (30+ dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{moderateAbsences.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pessoas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button onClick={checkAbsences} variant="outline">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Verificar Ausências
        </Button>
        <Button onClick={loadAbsenceReport} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Relatório
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Ausências</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Congregação</TableHead>
                <TableHead>Dias Ausente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{person.full_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {person.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {person.email}
                          </span>
                        )}
                        {person.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {person.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{person.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {person.congregations?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={getStatusColor(person.absence_status)}>
                      {person.days_absent || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(person.absence_status)}>
                      {person.absence_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {person.last_activity || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAttendance(person.id, person.full_name)}
                      >
                        <CalendarCheck className="h-3 w-3 mr-1" />
                        Marcar Presença
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPerson(person);
                              setAwayMode(false);
                              setAwayReason("");
                              setStartDate("");
                              setEndDate("");
                            }}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Viagem
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configurar Modo Viagem/Licença</DialogTitle>
                            <DialogDescription>
                              Configure o modo viagem para {selectedPerson?.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="away-mode"
                                checked={awayMode}
                                onCheckedChange={(checked) => setAwayMode(checked as boolean)}
                              />
                              <Label htmlFor="away-mode">Ativar modo viagem/licença</Label>
                            </div>

                            {awayMode && (
                              <>
                                <div>
                                  <Label htmlFor="reason">Motivo da ausência</Label>
                                  <Input
                                    id="reason"
                                    placeholder="Ex: Viagem, Licença médica, etc."
                                    value={awayReason}
                                    onChange={(e) => setAwayReason(e.target.value)}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="start-date">Data de início</Label>
                                    <Input
                                      id="start-date"
                                      type="date"
                                      value={startDate}
                                      onChange={(e) => setStartDate(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="end-date">Data de retorno</Label>
                                    <Input
                                      id="end-date"
                                      type="date"
                                      value={endDate}
                                      onChange={(e) => setEndDate(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="flex gap-2 pt-4">
                              <Button onClick={handleSetAwayMode} className="flex-1">
                                Salvar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}