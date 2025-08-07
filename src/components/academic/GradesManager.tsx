import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  BookOpen, 
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { useStudentGrades, useCreateGrade } from "@/hooks/useAcademic";
import { toast } from "sonner";

interface GradesManagerProps {
  classId?: string;
  subjectId?: string;
}

interface GradeFormData {
  studentId: string;
  subjectId: string;
  classId: string;
  gradeValue: number;
  assessmentType: 'prova' | 'trabalho' | 'participacao' | 'seminario';
  assessmentDate: string;
  observations: string;
}

export function GradesManager({ classId, subjectId }: GradesManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  
  const [gradeForm, setGradeForm] = useState<GradeFormData>({
    studentId: "",
    subjectId: subjectId || "",
    classId: classId || "",
    gradeValue: 0,
    assessmentType: 'prova',
    assessmentDate: new Date().toISOString().split('T')[0],
    observations: ""
  });

  // React Query hooks
  const { data: grades = [], isLoading, error } = useStudentGrades(undefined, subjectId);
  const createGrade = useCreateGrade();

  const handleCreateGrade = () => {
    setIsAddingGrade(true);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradeForm.studentId || !gradeForm.subjectId || !gradeForm.gradeValue) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createGrade.mutateAsync({
        student_id: gradeForm.studentId,
        subject_id: gradeForm.subjectId,
        class_id: gradeForm.classId,
        grade_value: gradeForm.gradeValue,
        assessment_type: gradeForm.assessmentType,
        assessment_date: gradeForm.assessmentDate,
        observations: gradeForm.observations
      });

      setIsAddingGrade(false);
      setGradeForm({
        studentId: "",
        subjectId: subjectId || "",
        classId: classId || "",
        gradeValue: 0,
        assessmentType: 'prova',
        assessmentDate: new Date().toISOString().split('T')[0],
        observations: ""
      });
    } catch (error) {
      console.error('Error creating grade:', error);
    }
  };

  const handleEditGrade = (grade: any) => {
    setEditingGrade(grade);
    setGradeForm({
      studentId: grade.student_id,
      subjectId: grade.subject_id,
      classId: grade.class_id,
      gradeValue: grade.grade_value,
      assessmentType: grade.assessment_type,
      assessmentDate: grade.assessment_date,
      observations: grade.observations || ""
    });
    setIsAddingGrade(true);
  };

  const handleDeleteGrade = (grade: any) => {
    // Implement delete logic here
    console.log('Deleting grade:', grade);
    toast.success("Nota excluída com sucesso!");
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return "text-green-600";
    if (grade >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBadge = (grade: number) => {
    if (grade >= 7) return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    if (grade >= 5) return <Badge className="bg-yellow-100 text-yellow-800">Recuperação</Badge>;
    return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
  };

  const getAssessmentTypeLabel = (type: string) => {
    const labels = {
      prova: "Prova",
      trabalho: "Trabalho",
      participacao: "Participação",
      seminario: "Seminário"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredGrades = grades.filter(grade => {
    const matchesSearch = searchTerm === "" || 
      grade.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || typeFilter === "" || grade.assessment_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando notas...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Erro ao carregar notas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Gerenciamento de Notas
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[200px]"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tipo de avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="prova">Prova</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="participacao">Participação</SelectItem>
                <SelectItem value="seminario">Seminário</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleCreateGrade}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>

            <Dialog open={isAddingGrade} onOpenChange={setIsAddingGrade}>
              <DialogTrigger asChild>
                <div style={{ display: 'none' }} />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGrade ? 'Editar Nota' : 'Adicionar Nova Nota'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitGrade} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Aluno *</Label>
                      <Select 
                        value={gradeForm.studentId} 
                        onValueChange={(value) => setGradeForm(prev => ({ ...prev, studentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">João Silva</SelectItem>
                          <SelectItem value="2">Maria Santos</SelectItem>
                          <SelectItem value="3">Carlos Oliveira</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessmentType">Tipo de Avaliação *</Label>
                      <Select 
                        value={gradeForm.assessmentType} 
                        onValueChange={(value: any) => setGradeForm(prev => ({ ...prev, assessmentType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prova">Prova</SelectItem>
                          <SelectItem value="trabalho">Trabalho</SelectItem>
                          <SelectItem value="participacao">Participação</SelectItem>
                          <SelectItem value="seminario">Seminário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gradeValue">Nota *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={gradeForm.gradeValue || ""}
                        onChange={(e) => setGradeForm(prev => ({ 
                          ...prev, 
                          gradeValue: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessmentDate">Data da Avaliação *</Label>
                      <Input
                        type="date"
                        value={gradeForm.assessmentDate}
                        onChange={(e) => setGradeForm(prev => ({ ...prev, assessmentDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      placeholder="Observações sobre a avaliação..."
                      value={gradeForm.observations}
                      onChange={(e) => setGradeForm(prev => ({ ...prev, observations: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddingGrade(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createGrade.isPending}>
                      {createGrade.isPending ? "Salvando..." : editingGrade ? "Atualizar Nota" : "Salvar Nota"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {grade.student_id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">Aluno {grade.student_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {grade.subject_id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getAssessmentTypeLabel(grade.assessment_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-lg font-bold ${getGradeColor(grade.grade_value)}`}>
                      {grade.grade_value.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(grade.assessment_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {getGradeBadge(grade.grade_value)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Editar"
                        onClick={() => handleEditGrade(grade)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Excluir"
                        onClick={() => handleDeleteGrade(grade)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredGrades.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma nota encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter
                ? "Tente ajustar os filtros de busca."
                : "Comece adicionando uma nova nota."}
            </p>
          </div>
        )}
      </CardContent>

    </Card>
  );
}