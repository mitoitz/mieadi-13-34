import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RetroactiveAttendanceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Student {
  id: string;
  full_name: string;
  cpf: string;
}

interface Class {
  id: string;
  name: string;
}

export function RetroactiveAttendanceManager({ open, onOpenChange }: RetroactiveAttendanceManagerProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
    class_id: "",
    selected_students: [] as string[]
  });

  useEffect(() => {
    if (open) {
      loadStudents();
      loadClasses();
    }
  }, [open]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cpf')
        .eq('role', 'aluno')
        .eq('status', 'ativo')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
      toast.error('Erro ao carregar estudantes');
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('status', 'ativa')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      toast.error('Erro ao carregar turmas');
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_students: prev.selected_students.includes(studentId)
        ? prev.selected_students.filter(id => id !== studentId)
        : [...prev.selected_students, studentId]
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      selected_students: prev.selected_students.length === students.length ? [] : students.map(s => s.id)
    }));
  };

  const isRetroactive = () => {
    if (!formData.date) return false;
    const selectedDate = new Date(formData.date);
    return isBefore(selectedDate, startOfDay(new Date()));
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.class_id || formData.selected_students.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (isRetroactive() && !formData.reason.trim()) {
      toast.error("Justificativa é obrigatória para frequências retroativas");
      return;
    }

    setLoading(true);

    try {
      const attendanceRecords = formData.selected_students.map(studentId => ({
        student_id: studentId,
        class_id: formData.class_id,
        date: formData.date,
        status: 'presente',
        is_retroactive: isRetroactive(),
        retroactive_reason: isRetroactive() ? formData.reason : null,
        notes: `Frequência registrada via sistema ${isRetroactive() ? '(retroativa)' : ''}`
      }));

      const { error } = await supabase
        .from('attendances')
        .insert(attendanceRecords);

      if (error) throw error;

      toast.success(`${attendanceRecords.length} frequências registradas com sucesso!`);
      
      // Reset form
      setFormData({
        date: "",
        reason: "",
        class_id: "",
        selected_students: []
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar frequências:', error);
      toast.error('Erro ao registrar frequências');
    } finally {
      setLoading(false);
    }
  };

  const selectedDate = formData.date ? new Date(formData.date) : null;
  const isDateRetroactive = isRetroactive();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Registrar Frequência{isDateRetroactive ? ' Retroativa' : ''}</span>
          </DialogTitle>
          <DialogDescription>
            {isDateRetroactive 
              ? "Registre frequências para datas anteriores com justificativa" 
              : "Registre frequências para a data selecionada"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data e Turma */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data da Aula*</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              {isDateRetroactive && (
                <div className="flex items-center space-x-2 text-orange-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Data retroativa - justificativa obrigatória</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Turma*</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classe) => (
                    <SelectItem key={classe.id} value={classe.id}>
                      {classe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Justificativa (apenas para retroativas) */}
          {isDateRetroactive && (
            <div className="space-y-2">
              <Label htmlFor="reason">Justificativa*</Label>
              <Textarea
                id="reason"
                placeholder="Explique o motivo da frequência retroativa..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          )}

          {/* Seleção de Estudantes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Estudantes Presentes*</span>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                type="button"
              >
                {formData.selected_students.length === students.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
              {students.map((student) => (
                <Card key={student.id} className="p-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={formData.selected_students.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm text-muted-foreground">{student.cpf}</div>
                    </div>
                    {formData.selected_students.includes(student.id) && (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Presente
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {formData.selected_students.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {formData.selected_students.length} estudante(s) selecionado(s)
              </div>
            )}
          </div>
        </div>

        {/* Resumo */}
        {selectedDate && formData.class_id && formData.selected_students.length > 0 && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Resumo do Registro:</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Data:</strong> {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                <div><strong>Turma:</strong> {classes.find(c => c.id === formData.class_id)?.name}</div>
                <div><strong>Presentes:</strong> {formData.selected_students.length} estudante(s)</div>
                {isDateRetroactive && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span><strong>Tipo:</strong> Frequência Retroativa</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.date || !formData.class_id || formData.selected_students.length === 0 || (isDateRetroactive && !formData.reason.trim())}
            className={isDateRetroactive ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {loading ? "Registrando..." : `Registrar ${formData.selected_students.length} Frequência(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}