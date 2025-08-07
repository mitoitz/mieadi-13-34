import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Play,
  Calendar,
  User,
  FileText,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassSession {
  id: string;
  session_date: string;
  session_time?: string;
  topic?: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface ClassData {
  id: string;
  name: string;
  subject_name: string;
  professor_name: string;
  professor_photo?: string;
  course_name?: string;
  total_sessions: number;
  completed_sessions: number;
  next_session?: ClassSession;
  materials: Array<{
    id: string;
    title: string;
    file_url?: string;
    material_type: string;
  }>;
  attendance_rate: number;
  average_grade?: number;
}

export function MinhasAulas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classesData, setClassesData] = useState<ClassData[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadStudentClasses();
    }
  }, [user?.id]);

  const loadStudentClasses = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Buscar matrículas do aluno
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes (
            id,
            name,
            subjects (
              name,
              courses (name)
            ),
            profiles (
              full_name,
              photo_url
            ),
            class_sessions (
              id,
              session_date,
              session_time,
              topic,
              description,
              status
            )
          )
        `)
        .eq('student_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      const classesWithData: ClassData[] = [];

      for (const enrollment of enrollments || []) {
        const classInfo = enrollment.classes;
        if (!classInfo) continue;

        // Buscar materiais da turma
        const { data: materials, error: materialsError } = await supabase
          .from('class_materials')
          .select('id, title, file_url, material_type')
          // @ts-ignore - Temporary fix for missing types
          .eq('class_id', (classInfo as any).id);

        if (materialsError) {
          console.error('Erro ao buscar materiais:', materialsError);
        }

        // Buscar frequência do aluno nesta turma
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendances')
          .select('status')
          .eq('student_id', user.id)
          // @ts-ignore - Temporary fix for Supabase types
          .eq('class_id', (classInfo as any).id);

        if (attendanceError) {
          console.error('Erro ao buscar frequência:', attendanceError);
        }

        // Calcular estatísticas
        const totalAttendance = attendance?.length || 0;
        const presentCount = attendance?.filter(a => a.status === 'presente').length || 0;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

        // @ts-ignore - Temporary fix for Supabase types
        const completedSessions = (classInfo as any).class_sessions?.filter((s: any) => s.status === 'completed').length || 0;
        // @ts-ignore - Temporary fix for Supabase types
        const totalSessions = (classInfo as any).class_sessions?.length || 0;

        // Encontrar próxima sessão
        // @ts-ignore - Temporary fix for Supabase types
        const nextSession = (classInfo as any).class_sessions
          ?.filter((session: any) => {
            const sessionDate = new Date(session.session_date);
            return sessionDate >= new Date() && session.status === 'scheduled';
          })
          .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0] as ClassSession | undefined;

        // Buscar nota média do aluno nesta turma
        const { data: gradesData } = await supabase
          .rpc('calculate_student_average', {
            student_uuid: user.id,
            // @ts-ignore - Temporary fix for Supabase types
            class_uuid: (classInfo as any).id
          });

        classesWithData.push({
          // @ts-ignore - Temporary fix for Supabase types
          id: (classInfo as any).id,
          // @ts-ignore - Temporary fix for Supabase types
          name: (classInfo as any).name,
          // @ts-ignore - Temporary fix for Supabase types
          subject_name: (classInfo as any).subjects?.name || 'Disciplina',
          // @ts-ignore - Temporary fix for Supabase types
          professor_name: (classInfo as any).profiles?.full_name || 'Professor',
          // @ts-ignore - Temporary fix for Supabase types
          professor_photo: (classInfo as any).profiles?.photo_url,
          // @ts-ignore - Temporary fix for Supabase types
          course_name: (classInfo as any).subjects?.courses?.name,
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          next_session: nextSession,
          materials: materials || [],
          attendance_rate: Math.round(attendanceRate),
          average_grade: gradesData || undefined
        });
      }

      setClassesData(classesWithData);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      toast.error('Erro ao carregar suas aulas');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const proximasAulas = classesData.filter(c => c.next_session).length;
  const aulasHoje = classesData.filter(c => {
    if (!c.next_session) return false;
    const today = new Date().toDateString();
    const sessionDate = new Date(c.next_session.session_date).toDateString();
    return today === sessionDate;
  }).length;
  const totalDisciplinas = classesData.length;
  const frequenciaMedia = classesData.length > 0 
    ? Math.round(classesData.reduce((sum, c) => sum + c.attendance_rate, 0) / classesData.length)
    : 0;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendada";
      case "completed":
        return "Concluída";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">Você precisa estar logado para ver suas aulas</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando suas aulas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minhas Aulas</h1>
          <p className="text-muted-foreground">Acompanhe suas aulas, disciplinas e materiais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Próximas Aulas"
          value={proximasAulas.toString()}
          icon={Calendar}
          trend={{ value: proximasAulas, isPositive: true }}
        />
        <DashboardCard
          title="Aulas Hoje"
          value={aulasHoje.toString()}
          icon={Clock}
          trend={{ value: aulasHoje, isPositive: true }}
        />
        <DashboardCard
          title="Disciplinas Ativas"
          value={totalDisciplinas.toString()}
          icon={BookOpen}
          trend={{ value: totalDisciplinas, isPositive: true }}
        />
        <DashboardCard
          title="Frequência Média"
          value={`${frequenciaMedia}%`}
          icon={CheckCircle}
          trend={{ value: frequenciaMedia >= 80 ? 5 : -5, isPositive: frequenciaMedia >= 80 }}
        />
      </div>

      <Tabs defaultValue="proximas-aulas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proximas-aulas">Próximas Aulas</TabsTrigger>
          <TabsTrigger value="disciplinas">Minhas Disciplinas</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
        </TabsList>

        <TabsContent value="proximas-aulas" className="space-y-4">
          <div className="grid gap-4">
            {classesData
              .filter(classItem => classItem.next_session)
              .map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={classItem.professor_photo} alt={classItem.professor_name} />
                          <AvatarFallback>{getInitials(classItem.professor_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-lg">{classItem.subject_name}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Prof. {classItem.professor_name} • {classItem.name}
                          </div>
                          <div className="text-sm">
                            {classItem.next_session?.description || classItem.next_session?.topic || 'Aula regular'}
                          </div>
                        </div>
                      </div>

                      {classItem.next_session && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Data</div>
                            <div className="text-sm font-medium">
                              {format(new Date(classItem.next_session.session_date), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Horário</div>
                            <div className="text-sm font-medium">
                              {classItem.next_session.session_time || "A definir"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Status</div>
                            <Badge variant={getStatusBadgeVariant(classItem.next_session.status)}>
                              {getStatusLabel(classItem.next_session.status)}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Acessar Aula
                        </Button>
                      </div>
                    </div>

                    {classItem.materials && classItem.materials.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Materiais Disponíveis:</div>
                        <div className="flex flex-wrap gap-2">
                          {classItem.materials.slice(0, 3).map((material) => (
                            <Badge key={material.id} variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {material.title}
                            </Badge>
                          ))}
                          {classItem.materials.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{classItem.materials.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

            {classesData.filter(c => c.next_session).length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma aula agendada</h3>
                    <p className="text-muted-foreground">
                      Não há aulas programadas para os próximos dias.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disciplinas" className="space-y-4">
          <div className="grid gap-4">
            {classesData.map((classItem) => {
              const progressoPercentual = getProgressPercentage(classItem.completed_sessions, classItem.total_sessions);
              
              return (
                <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-lg">{classItem.subject_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {classItem.name} • Prof. {classItem.professor_name}
                            </div>
                            {classItem.course_name && (
                              <div className="text-xs text-muted-foreground">
                                Curso: {classItem.course_name}
                              </div>
                            )}
                          </div>
                          <Badge variant={progressoPercentual === 100 ? "outline" : "default"}>
                            {progressoPercentual === 100 ? "Concluída" : "Cursando"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Aulas</div>
                            <div className="text-sm font-medium">
                              {classItem.completed_sessions}/{classItem.total_sessions}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Frequência</div>
                            <div className="text-sm font-medium flex items-center justify-center gap-1">
                              {classItem.attendance_rate}%
                              {classItem.attendance_rate >= 80 ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-orange-500" />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Nota</div>
                            <div className="text-sm font-medium">
                              {classItem.average_grade ? classItem.average_grade.toFixed(1) : "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Materiais</div>
                            <div className="text-sm font-medium">{classItem.materials.length}</div>
                          </div>
                        </div>

                        {classItem.next_session && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Próxima aula: </span>
                              <span className="font-medium">
                                {format(new Date(classItem.next_session.session_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Progresso do Curso</span>
                            <span className="text-sm font-medium">{progressoPercentual}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progressoPercentual, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          Materiais ({classItem.materials.length})
                        </Button>
                        <Button variant="outline" size="sm">
                          <User className="w-4 h-4 mr-1" />
                          Professor
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="materiais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biblioteca de Materiais</CardTitle>
              <p className="text-muted-foreground">
                Acesse todos os materiais das suas disciplinas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesData.map((classItem) => (
                  <Card key={classItem.id} className="border-dashed hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <h4 className="font-medium">{classItem.subject_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Prof. {classItem.professor_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {classItem.materials.length} materiais
                          </p>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Acessar Materiais
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!loading && classesData.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma disciplina encontrada</p>
              <p>Você ainda não está matriculado em nenhuma turma</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}