import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Calendar, 
  BookOpen,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { academicCalculationsService, type AcademicProgress, type StudentGradeCalculation } from "@/services/academic-calculations.service";
import { toast } from "sonner";

interface AcademicHistoryProps {
  studentId: string;
}

export function AcademicHistory({ studentId }: AcademicHistoryProps) {
  const [progress, setProgress] = useState<AcademicProgress | null>(null);
  const [gradeCalculations, setGradeCalculations] = useState<StudentGradeCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  useEffect(() => {
    loadAcademicData();
  }, [studentId]);

  const loadAcademicData = async () => {
    try {
      setIsLoading(true);
      const [progressData, gradesData] = await Promise.all([
        academicCalculationsService.calculateAcademicProgress(studentId),
        academicCalculationsService.calculateStudentGrades(studentId)
      ]);
      
      setProgress(progressData);
      setGradeCalculations(gradesData);
    } catch (error) {
      console.error("Error loading academic data:", error);
      toast.error("Erro ao carregar dados acadêmicos");
    } finally {
      setIsLoading(false);
    }
  };

  const formatGrade = (grade: number) => {
    return grade.toFixed(1).replace('.', ',');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Reprovado</Badge>;
      case 'recovery':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Recuperação</Badge>;
      case 'incomplete':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Incompleto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Ativo</Badge>;
      case 'graduated':
        return <Badge className="bg-green-100 text-green-800">Formado</Badge>;
      case 'dropped':
        return <Badge className="bg-gray-100 text-gray-800">Trancado</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredGrades = gradeCalculations.filter(calc => {
    const matchesSearch = searchTerm === "" || 
      calc.subjectId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || statusFilter === "" || calc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getGradeDistribution = () => {
    const distribution = gradeCalculations.reduce((acc, calc) => {
      if (calc.status === 'approved') acc.approved++;
      else if (calc.status === 'failed') acc.failed++;
      else if (calc.status === 'recovery') acc.recovery++;
      else acc.incomplete++;
      return acc;
    }, { approved: 0, failed: 0, recovery: 0, incomplete: 0 });

    return distribution;
  };

  const distribution = getGradeDistribution();
  const completionPercentage = progress ? (progress.completedSubjects / progress.totalSubjects) * 100 : 0;
  const creditCompletionPercentage = progress ? (progress.completedCredits / progress.totalCredits) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando histórico acadêmico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Progresso Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionPercentage.toFixed(1)}%</div>
              <Progress value={completionPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedSubjects} de {progress.totalSubjects} disciplinas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Média Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatGrade(progress.averageGrade)}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Bom desempenho</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Créditos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress.completedCredits}/{progress.totalCredits}</div>
              <Progress value={creditCompletionPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {creditCompletionPercentage.toFixed(1)}% dos créditos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">{getProgressStatusBadge(progress.status)}</div>
              <p className="text-sm text-muted-foreground">
                Semestre: {progress.currentSemester}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribuição de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{distribution.approved}</div>
              <p className="text-sm text-muted-foreground">Aprovado</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{distribution.recovery}</div>
              <p className="text-sm text-muted-foreground">Recuperação</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{distribution.failed}</div>
              <p className="text-sm text-muted-foreground">Reprovado</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{distribution.incomplete}</div>
              <p className="text-sm text-muted-foreground">Incompleto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico Detalhado */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Histórico de Disciplinas</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar disciplina..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="failed">Reprovado</SelectItem>
                <SelectItem value="recovery">Recuperação</SelectItem>
                <SelectItem value="incomplete">Incompleto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="2024.1">2024.1</SelectItem>
                <SelectItem value="2024.2">2024.2</SelectItem>
                <SelectItem value="2023.2">2023.2</SelectItem>
                <SelectItem value="2023.1">2023.1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead>Nota Final</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Calculado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((calculation) => (
                <TableRow key={`${calculation.subjectId}-${calculation.classId}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{calculation.subjectId}</div>
                      <div className="text-sm text-muted-foreground">
                        Turma: {calculation.classId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-lg font-bold ${
                      calculation.finalGrade >= 7 ? 'text-green-600' :
                      calculation.finalGrade >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatGrade(calculation.finalGrade)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      calculation.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculation.attendancePercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(calculation.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(calculation.calculatedAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredGrades.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter || semesterFilter
                  ? "Tente ajustar os filtros de busca."
                  : "Nenhuma disciplina foi encontrada para este aluno."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}