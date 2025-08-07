import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Download, 
  TrendingUp, 
  Award,
  Target,
  BarChart3,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Eye,
  Loader2
} from "lucide-react";
import { useStudentGrades, useStudentAverage } from "@/hooks/useStudentGrades";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassData {
  id: string;
  name: string;
  professor_name: string;
  subject_name: string;
  course_name?: string;
}

interface GradesByClass {
  class_id: string;
  class_name: string;
  subject_name: string;
  professor_name: string;
  course_name?: string;
  grades: Array<{
    id: string;
    grade: number;
    max_grade: number;
    weight: number;
    assessment_type: string;
    date: string;
    notes?: string;
  }>;
  average: number;
  total_credits: number;
  attendance_rate: number;
}

export default function MinhasNotas() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("all");
  const [loading, setLoading] = useState(true);
  const [gradesByClass, setGradesByClass] = useState<GradesByClass[]>([]);

  // Buscar dados reais do Supabase
  const { data: grades, isLoading: gradesLoading } = useStudentGrades(user?.id);
  const { data: studentAverage } = useStudentAverage(user?.id || '');

  useEffect(() => {
    if (user?.id && grades) {
      processGradesData();
    }
  }, [user?.id, grades]);

  const processGradesData = async () => {
    if (!user?.id || !grades) return;
    
    try {
      setLoading(true);

      // Agrupar notas por turma
      const gradesByClassMap = new Map<string, GradesByClass>();

      for (const grade of grades) {
        if (!gradesByClassMap.has(grade.class_id)) {
          // Buscar informações da turma
          const { data: classInfo, error: classError } = await supabase
            .from('classes')
            .select(`
              id,
              name,
              subjects (
                name,
                courses (name)
              ),
              profiles (
                full_name
              )
            `)
            .eq('id', grade.class_id)
            .single();

          if (classError) {
            console.error('Erro ao buscar turma:', classError);
            continue;
          }

          // Buscar frequência da turma
          const { data: attendance, error: attendanceError } = await supabase
            .from('attendances')
            .select('status')
            .eq('student_id', user.id)
            .eq('class_id', grade.class_id);

          const totalAttendance = attendance?.length || 0;
          const presentCount = attendance?.filter(a => a.status === 'presente').length || 0;
          const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

          gradesByClassMap.set(grade.class_id, {
            class_id: grade.class_id,
            class_name: classInfo?.name || 'Turma não encontrada',
            // @ts-ignore - Temporary fix for Supabase types
            subject_name: (classInfo as any)?.subjects?.name || 'Disciplina não encontrada',
            // @ts-ignore - Temporary fix for Supabase types
            professor_name: (classInfo as any)?.profiles?.full_name || 'Professor não encontrado',
            // @ts-ignore - Temporary fix for Supabase types
            course_name: (classInfo as any)?.subjects?.courses?.name,
            grades: [],
            average: 0,
            total_credits: 4, // Default, pode ser atualizado posteriormente
            attendance_rate: Math.round(attendanceRate)
          });
        }

        // Adicionar nota à turma
        const classData = gradesByClassMap.get(grade.class_id);
        if (classData) {
          classData.grades.push({
            id: grade.id,
            grade: grade.grade,
            max_grade: grade.max_grade,
            weight: grade.weight,
            assessment_type: grade.assessment_type,
            date: grade.date,
            notes: grade.notes
          });
        }
      }

      // Calcular médias para cada turma
      const processedData = Array.from(gradesByClassMap.values()).map(classData => {
        if (classData.grades.length > 0) {
          const totalWeight = classData.grades.reduce((sum, grade) => sum + grade.weight, 0);
          const weightedSum = classData.grades.reduce((sum, grade) => sum + (grade.grade * grade.weight), 0);
          classData.average = totalWeight > 0 ? weightedSum / totalWeight : 0;
        }
        return classData;
      });

      setGradesByClass(processedData);
    } catch (error) {
      console.error('Erro ao processar dados de notas:', error);
      toast.error('Erro ao carregar dados acadêmicos');
    } finally {
      setLoading(false);
    }
  };

  const calcularMediaGeral = () => {
    if (gradesByClass.length === 0) return "0.0";
    
    const somaCreditos = gradesByClass.reduce((sum, item) => sum + (item.average * item.total_credits), 0);
    const totalCreditos = gradesByClass.reduce((sum, item) => sum + item.total_credits, 0);
    
    return totalCreditos > 0 ? (somaCreditos / totalCreditos).toFixed(1) : "0.0";
  };

  const getStatusColor = (average: number) => {
    if (average >= 7) return "bg-green-100 text-green-800 border-green-200";
    if (average >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusLabel = (average: number) => {
    if (average >= 7) return "Aprovado";
    if (average >= 5) return "Recuperação";
    return "Reprovado";
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 9) return "text-green-600 font-semibold";
    if (nota >= 7) return "text-blue-600 font-semibold";
    if (nota >= 6) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const disciplinasUnicas = Array.from(new Set(gradesByClass.map(item => item.subject_name)));

  const dadosFiltrados = gradesByClass.filter(item => {
    const matchSearch = item.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.professor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.class_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDisciplina = selectedDisciplina === "all" || item.subject_name === selectedDisciplina;
    
    return matchSearch && matchDisciplina;
  });

  const ResumoAcademico = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
              <div className="text-2xl font-bold text-primary">
                {studentAverage ? studentAverage.toFixed(1) : calcularMediaGeral()}
              </div>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Disciplinas</p>
              <div className="text-2xl font-bold">{gradesByClass.length}</div>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
              <div className="text-2xl font-bold text-green-600">
                {gradesByClass.filter(item => item.average >= 7).length}
              </div>
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Créditos</p>
              <div className="text-2xl font-bold">
                {gradesByClass.reduce((sum, item) => sum + item.total_credits, 0)}
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ListaNotas = () => {
    if (loading || gradesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando suas notas...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dadosFiltrados.map((item) => (
          <Card key={item.class_id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {item.subject_name}
                  </CardTitle>
                  <CardDescription>
                    {item.professor_name} • {item.class_name}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(item.average)}>
                    {getStatusLabel(item.average)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.total_credits} créditos
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Avaliações ({item.grades.length})
                  </h4>
                  <div className="space-y-3">
                    {item.grades.length > 0 ? (
                      item.grades.map((grade) => (
                        <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{grade.assessment_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(grade.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getNotaColor(grade.grade)}`}>
                              {grade.grade.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Peso: {grade.weight}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Nenhuma avaliação encontrada</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Desempenho</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Média:</span>
                        <span className={`text-xl font-bold ${getNotaColor(item.average)}`}>
                          {item.average.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Frequência:</span>
                          <span className="font-medium">{item.attendance_rate}%</span>
                        </div>
                        <Progress value={item.attendance_rate} className="h-2" />
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          Detalhes Completos
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const GraficoDesempenho = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução das Notas
        </CardTitle>
        <CardDescription>
          Acompanhe sua evolução acadêmica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gráfico de evolução será implementado em breve</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">Você precisa estar logado para ver suas notas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Notas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho acadêmico e evolução
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Boletim Completo
        </Button>
      </div>

      <ResumoAcademico />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar disciplina ou professor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {disciplinasUnicas.map((disciplina) => (
              <SelectItem key={disciplina} value={disciplina}>
                {disciplina}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="notas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notas">Notas por Disciplina</TabsTrigger>
          <TabsTrigger value="desempenho">Gráfico de Desempenho</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notas">
          <ListaNotas />
        </TabsContent>
        
        <TabsContent value="desempenho">
          <GraficoDesempenho />
        </TabsContent>
      </Tabs>

      {!loading && !gradesLoading && dadosFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma nota encontrada</p>
              <p>Você ainda não possui avaliações registradas no sistema</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}