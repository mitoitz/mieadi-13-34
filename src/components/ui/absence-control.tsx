import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  UserX, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Clock, 
  Plane, 
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Activity,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AbsenceRecord {
  id: string;
  type: 'travel' | 'health' | 'work' | 'family' | 'other';
  reason: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  notifyManager: boolean;
  priority: 'low' | 'medium' | 'high';
  contactInfo?: string;
}

interface AbsenceSettings {
  enableNotifications: boolean;
  maxAbsenceThreshold: number;
  autoNotifyDays: number;
  requireApproval: boolean;
}

interface AbsenceControlProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  onAbsenceUpdated?: () => void;
}

export function AbsenceControl({ 
  isOpen, 
  onClose, 
  personId, 
  personName, 
  onAbsenceUpdated 
}: AbsenceControlProps) {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [settings, setSettings] = useState<AbsenceSettings>({
    enableNotifications: true,
    maxAbsenceThreshold: 3,
    autoNotifyDays: 7,
    requireApproval: false
  });
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<AbsenceRecord | null>(null);
  const [formData, setFormData] = useState({
    type: 'travel' as AbsenceRecord['type'],
    reason: '',
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    notes: '',
    notifyManager: true,
    priority: 'medium' as AbsenceRecord['priority'],
    contactInfo: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    // Carregar dados existentes do localStorage ou de uma API
    loadAbsenceData();
  }, [personId]);

  const loadAbsenceData = () => {
    try {
      const savedData = localStorage.getItem(`absence_${personId}`);
      const savedSettings = localStorage.getItem(`absence_settings_${personId}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData).map((item: any) => ({
          ...item,
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : undefined,
          createdAt: new Date(item.createdAt)
        }));
        setAbsences(parsedData);
      }
      
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading absence data:', error);
    }
  };

  const saveAbsenceData = (newAbsences: AbsenceRecord[]) => {
    try {
      localStorage.setItem(`absence_${personId}`, JSON.stringify(newAbsences));
    } catch (error) {
      console.error('Error saving absence data:', error);
    }
  };

  const saveSettings = (newSettings: AbsenceSettings) => {
    try {
      localStorage.setItem(`absence_settings_${personId}`, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const absenceTypes = [
    { value: 'travel', label: 'Viagem', icon: Plane, color: 'bg-blue-500' },
    { value: 'health', label: 'Saúde', icon: AlertTriangle, color: 'bg-red-500' },
    { value: 'work', label: 'Trabalho', icon: Clock, color: 'bg-green-500' },
    { value: 'family', label: 'Família', icon: User, color: 'bg-purple-500' },
    { value: 'other', label: 'Outro', icon: MapPin, color: 'bg-gray-500' }
  ] as const;

  const priorityTypes = [
    { value: 'low', label: 'Baixa', color: 'text-green-600' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600' },
    { value: 'high', label: 'Alta', color: 'text-red-600' }
  ] as const;

  const resetForm = () => {
    setFormData({
      type: 'travel',
      reason: '',
      startDate: new Date(),
      endDate: undefined,
      notes: '',
      notifyManager: true,
      priority: 'medium',
      contactInfo: ''
    });
    setEditingAbsence(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da ausência.",
        variant: "destructive",
      });
      return;
    }

    const newAbsence: AbsenceRecord = {
      id: editingAbsence?.id || Math.random().toString(36).substring(7),
      type: formData.type,
      reason: formData.reason,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: !formData.endDate || formData.endDate > new Date(),
      notes: formData.notes,
      notifyManager: formData.notifyManager,
      priority: formData.priority,
      contactInfo: formData.contactInfo,
      createdAt: editingAbsence?.createdAt || new Date()
    };

    let updatedAbsences: AbsenceRecord[];
    if (editingAbsence) {
      updatedAbsences = absences.map(absence => 
        absence.id === editingAbsence.id ? newAbsence : absence
      );
      toast({
        title: "Ausência atualizada!",
        description: "Os dados da ausência foram atualizados com sucesso.",
      });
    } else {
      updatedAbsences = [...absences, newAbsence];
      toast({
        title: "Ausência registrada!",
        description: "A ausência foi registrada no sistema.",
      });
    }

    setAbsences(updatedAbsences);
    saveAbsenceData(updatedAbsences);

    setShowForm(false);
    resetForm();
    onAbsenceUpdated?.();
  };

  const handleEdit = (absence: AbsenceRecord) => {
    setEditingAbsence(absence);
    setFormData({
      type: absence.type,
      reason: absence.reason,
      startDate: absence.startDate,
      endDate: absence.endDate,
      notes: absence.notes || '',
      notifyManager: absence.notifyManager,
      priority: absence.priority,
      contactInfo: absence.contactInfo || ''
    });
    setShowForm(true);
  };

  const handleDelete = (absenceId: string) => {
    const updatedAbsences = absences.filter(absence => absence.id !== absenceId);
    setAbsences(updatedAbsences);
    saveAbsenceData(updatedAbsences);
    toast({
      title: "Ausência removida",
      description: "O registro de ausência foi removido.",
    });
    onAbsenceUpdated?.();
  };

  const getTypeInfo = (type: AbsenceRecord['type']) => {
    return absenceTypes.find(t => t.value === type) || absenceTypes[0];
  };

  const isAbsenceActive = (absence: AbsenceRecord) => {
    const now = new Date();
    const start = absence.startDate;
    const end = absence.endDate;
    
    if (!end) return true; // Ausência indefinida
    return start <= now && now <= end;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Controle de Ausências - {personName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Gerencie os períodos de ausência e motivos
              </p>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              variant="hero"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Ausência
            </Button>
          </div>

          {/* Ausências Ativas */}
          {absences.filter(absence => isAbsenceActive(absence)).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-orange-600">
                  Ausências Ativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {absences
                  .filter(absence => isAbsenceActive(absence))
                  .map(absence => {
                    const typeInfo = getTypeInfo(absence.type);
                    const TypeIcon = typeInfo.icon;
                    
                    return (
                      <div key={absence.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", typeInfo.color)}>
                              <TypeIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">{absence.reason}</h4>
                              <p className="text-sm text-muted-foreground">
                                Início: {format(absence.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                                {absence.endDate && (
                                  <> - Fim: {format(absence.endDate, 'dd/MM/yyyy', { locale: ptBR })}</>
                                )}
                              </p>
                              {absence.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{absence.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Ausente</Badge>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(absence)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Histórico de Ausências */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Ausências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {absences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma ausência registrada</p>
                </div>
              ) : (
                absences.map(absence => {
                  const typeInfo = getTypeInfo(absence.type);
                  const TypeIcon = typeInfo.icon;
                  const isActive = isAbsenceActive(absence);
                  
                  return (
                    <div key={absence.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", typeInfo.color)}>
                            <TypeIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{absence.reason}</h4>
                            <p className="text-sm text-muted-foreground">
                              Início: {format(absence.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                              {absence.endDate && (
                                <> - Fim: {format(absence.endDate, 'dd/MM/yyyy', { locale: ptBR })}</>
                              )}
                            </p>
                            {absence.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{absence.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isActive ? "destructive" : "secondary"}>
                            {isActive ? "Ausente" : "Finalizada"}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(absence)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(absence.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Form Modal */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingAbsence ? 'Editar Ausência' : 'Nova Ausência'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo de Ausência *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as AbsenceRecord['type'] }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {absenceTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="reason">Motivo *</Label>
                      <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Ex: Viagem para São Paulo"
                        required
                      />
                    </div>

                    <div>
                      <Label>Data de Início *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? format(formData.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Data de Fim (opcional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endDate ? format(formData.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data definida'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as AbsenceRecord['priority'] }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityTypes.map(priority => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <span className={priority.color}>{priority.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="contactInfo">Contato durante ausência</Label>
                      <Input
                        id="contactInfo"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                        placeholder="Telefone ou email para contato"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.notifyManager}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifyManager: checked }))}
                    />
                    <Label className="text-sm">
                      Notificar coordenador sobre esta ausência
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Informações adicionais sobre a ausência..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" variant="hero">
                      {editingAbsence ? 'Atualizar' : 'Registrar'} Ausência
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}