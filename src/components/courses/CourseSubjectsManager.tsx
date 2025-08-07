import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  BookOpen, 
  Star, 
  StarOff,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  useCourseSubjectsByCourse,
  useAvailableSubjectsForCourse,
  useAddSubjectToCourse,
  useRemoveSubjectFromCourse,
  useUpdateSubjectOrder,
  useToggleSubjectRequired
} from "@/hooks/useCourseSubjects";
import { useToast } from "@/hooks/use-toast";

interface CourseSubjectsManagerProps {
  courseId: string;
  courseName: string;
}

export function CourseSubjectsManager({ courseId, courseName }: CourseSubjectsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newSubjectOrder, setNewSubjectOrder] = useState(1);
  const [isRequired, setIsRequired] = useState(true);

  const { toast } = useToast();
  
  const { data: courseSubjects = [], isLoading } = useCourseSubjectsByCourse(courseId);
  const { data: availableSubjects = [] } = useAvailableSubjectsForCourse(courseId);
  const addSubjectMutation = useAddSubjectToCourse();
  const removeSubjectMutation = useRemoveSubjectFromCourse();
  const updateOrderMutation = useUpdateSubjectOrder();
  const toggleRequiredMutation = useToggleSubjectRequired();

  const handleAddSubject = async () => {
    if (!selectedSubjectId) {
      toast({
        title: "Erro",
        description: "Selecione uma disciplina para adicionar",
        variant: "destructive"
      });
      return;
    }

    await addSubjectMutation.mutateAsync({
      course_id: courseId,
      subject_id: selectedSubjectId,
      order_index: newSubjectOrder,
      is_required: isRequired
    });

    setSelectedSubjectId("");
    setNewSubjectOrder(1);
    setIsRequired(true);
    setIsAddDialogOpen(false);
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (confirm("Tem certeza que deseja remover esta disciplina do curso?")) {
      await removeSubjectMutation.mutateAsync({ courseId, subjectId });
    }
  };

  const handleOrderChange = async (id: string, direction: 'up' | 'down') => {
    const currentSubject = courseSubjects.find(cs => cs.id === id);
    if (!currentSubject) return;

    const newOrder = direction === 'up' 
      ? Math.max(1, currentSubject.order_index - 1)
      : currentSubject.order_index + 1;

    await updateOrderMutation.mutateAsync({ id, newOrder });
  };

  const handleToggleRequired = async (id: string, currentRequired: boolean) => {
    await toggleRequiredMutation.mutateAsync({ 
      id, 
      isRequired: !currentRequired 
    });
  };

  if (isLoading) {
    return <div>Carregando disciplinas do curso...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Disciplinas do Curso: {courseName}
          </CardTitle>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Disciplina
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Disciplina ao Curso</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <div>
                            <div className="font-medium">{subject.name}</div>
                            {subject.code && (
                              <div className="text-sm text-muted-foreground">
                                Código: {subject.code}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ordem no Currículo</Label>
                  <Input
                    type="number"
                    value={newSubjectOrder}
                    onChange={(e) => setNewSubjectOrder(parseInt(e.target.value) || 1)}
                    min="1"
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                  />
                  <Label htmlFor="required">Disciplina obrigatória</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddSubject}
                    disabled={!selectedSubjectId || addSubjectMutation.isPending}
                    className="flex-1"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {courseSubjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma disciplina adicionada a este curso ainda.</p>
            <p className="text-sm">Clique em "Adicionar Disciplina" para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {courseSubjects
              .sort((a, b) => a.order_index - b.order_index)
              .map((courseSubject, index) => (
                <div
                  key={courseSubject.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium w-8 text-center">
                      {courseSubject.order_index}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{courseSubject.subject?.name}</h4>
                      {courseSubject.subject?.code && (
                        <Badge variant="outline" className="text-xs">
                          {courseSubject.subject.code}
                        </Badge>
                      )}
                      {courseSubject.is_required ? (
                        <Badge className="text-xs">Obrigatória</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Optativa</Badge>
                      )}
                      {courseSubject.subject?.credits && (
                        <Badge variant="outline" className="text-xs">
                          {courseSubject.subject.credits} créditos
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrderChange(courseSubject.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrderChange(courseSubject.id, 'down')}
                      disabled={index === courseSubjects.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRequired(courseSubject.id, courseSubject.is_required)}
                    >
                      {courseSubject.is_required ? (
                        <Star className="h-4 w-4" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSubject(courseSubject.subject_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}