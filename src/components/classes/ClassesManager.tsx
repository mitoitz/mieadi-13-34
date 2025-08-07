
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Class {
  id: string;
  name: string;
  subject_id?: string;
  professor_id?: string;
  congregation_id?: string;
  subject?: {
    name: string;
  };
  professor?: {
    full_name: string;
  };
  congregation?: {
    name: string;
  };
  start_date: string;
  end_date: string;
  schedule: string;
  max_students: number;
  status: string;
  enrollments?: any[];
}

interface ClassesManagerProps {
  userType: string;
  userId?: string;
}

export function ClassesManager({ userType, userId }: ClassesManagerProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [congregations, setCongregations] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    professor_id: '',
    congregation_id: '',
    start_date: '',
    end_date: '',
    schedule: '',
    max_students: 30,
    status: 'ativa'
  });

  useEffect(() => {
    loadClasses();
    loadRelatedData();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from('classes')
        .select(`
          *,
          subject:subjects(name),
          professor:profiles!classes_professor_id_fkey(full_name),
          congregation:congregations(name),
          enrollments(count)
        `)
        .order('created_at', { ascending: false });

      if (userType === 'professor' && userId) {
        query = query.eq('professor_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar turmas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [subjectsRes, professorsRes, congregationsRes] = await Promise.all([
        (supabase as any).from('subjects').select('*'),
        (supabase as any).from('profiles').select('*').eq('role', 'professor'),
        (supabase as any).from('congregations').select('*')
      ]);

      setSubjects(subjectsRes.data || []);
      setProfessors(professorsRes.data || []);
      setCongregations(congregationsRes.data || []);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        const { error } = await (supabase as any)
          .from('classes')
          .update(formData)
          .eq('id', editingClass.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Turma atualizada com sucesso"
        });
      } else {
        const { error } = await (supabase as any)
          .from('classes')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Turma criada com sucesso"
        });
      }

      setShowNewClassForm(false);
      setEditingClass(null);
      setFormData({
        name: '',
        subject_id: '',
        professor_id: '',
        congregation_id: '',
        start_date: '',
        end_date: '',
        schedule: '',
        max_students: 30,
        status: 'ativa'
      });
      loadClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar turma",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      subject_id: classItem.subject_id || '',
      professor_id: classItem.professor_id || '',
      congregation_id: classItem.congregation_id || '',
      start_date: classItem.start_date,
      end_date: classItem.end_date,
      schedule: classItem.schedule || '',
      max_students: classItem.max_students,
      status: classItem.status
    });
    setShowNewClassForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return;

    try {
      const { error } = await (supabase as any)
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Turma excluída com sucesso"
      });
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir turma",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-green-100 text-green-800';
      case 'inativa':
        return 'bg-red-100 text-red-800';
      case 'concluida':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando turmas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Turmas</h2>
          <p className="text-muted-foreground">Gerencie as turmas do MIEADI</p>
        </div>
        
        {['admin', 'coordenador'].includes(userType) && (
          <Button onClick={() => setShowNewClassForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{classItem.name}</CardTitle>
                <Badge className={getStatusColor(classItem.status)}>
                  {classItem.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{classItem.subject?.name || 'Sem disciplina'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{classItem.professor?.full_name || 'Sem professor'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{classItem.congregation?.name || 'Sem congregação'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classItem.enrollments?.length || 0}/{classItem.max_students} alunos</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(classItem.start_date).toLocaleDateString('pt-BR')}</span>
              </div>
              
              {classItem.schedule && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{classItem.schedule}</span>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                
                {['admin', 'coordenador'].includes(userType) && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(classItem)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={showNewClassForm} onOpenChange={setShowNewClassForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? 'Editar Turma' : 'Nova Turma'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Turma</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="subject_id">Disciplina</Label>
                <Select value={formData.subject_id} onValueChange={(value) => setFormData({...formData, subject_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="professor_id">Professor</Label>
                <Select value={formData.professor_id} onValueChange={(value) => setFormData({...formData, professor_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map((professor) => (
                      <SelectItem key={professor.id} value={professor.id}>
                        {professor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="congregation_id">Congregação</Label>
                <Select value={formData.congregation_id} onValueChange={(value) => setFormData({...formData, congregation_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((congregation) => (
                      <SelectItem key={congregation.id} value={congregation.id}>
                        {congregation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">Data de Término</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="max_students">Máximo de Alunos</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({...formData, max_students: parseInt(e.target.value)})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="schedule">Horário</Label>
              <Textarea
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                placeholder="Ex: Segunda e Quarta, 19h às 21h"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewClassForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingClass ? 'Atualizar' : 'Criar'} Turma
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
