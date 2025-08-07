import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ChevronDown, ChevronRight } from "lucide-react";
import { StudentData } from "@/services/matriculas.service";
import { MatriculaCard } from "./MatriculaCard";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MatriculasByClassProps {
  students: StudentData[];
  onStatusChange?: (enrollmentId: string, status: string) => void;
  onRemove?: (enrollmentId: string) => void;
  selectedStudents?: string[];
  onStudentSelect?: (enrollmentId: string, selected: boolean) => void;
}

export function MatriculasByClass({
  students,
  onStatusChange,
  onRemove,
  selectedStudents = [],
  onStudentSelect
}: MatriculasByClassProps) {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  // Agrupar estudantes por turma
  const studentsByClass = students.reduce((acc, student) => {
    const classKey = student.turmaId || 'sem-turma';
    const className = student.turma || 'Sem Turma';
    
    if (!acc[classKey]) {
      acc[classKey] = {
        id: classKey,
        name: className,
        students: []
      };
    }
    
    acc[classKey].students.push(student);
    return acc;
  }, {} as Record<string, { id: string; name: string; students: StudentData[] }>);

  const classes = Object.values(studentsByClass);

  const toggleClass = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const getStatusCounts = (students: StudentData[]) => {
    const counts = {
      ativo: 0,
      inativo: 0,
      pendente: 0,
      desistente: 0,
      transferido: 0,
      concluido: 0
    };
    
    students.forEach(student => {
      if (counts.hasOwnProperty(student.status)) {
        counts[student.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma matrícula encontrada</h3>
        <p className="text-muted-foreground">
          Não há matrículas para exibir no momento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((classGroup) => {
        const isExpanded = expandedClasses.has(classGroup.id);
        const statusCounts = getStatusCounts(classGroup.students);
        
        return (
          <Card key={classGroup.id} className="overflow-hidden">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                  onClick={() => toggleClass(classGroup.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {classGroup.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {classGroup.students.length} aluno{classGroup.students.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {statusCounts.ativo > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {statusCounts.ativo} Ativo{statusCounts.ativo > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {statusCounts.pendente > 0 && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {statusCounts.pendente} Pendente{statusCounts.pendente > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {statusCounts.desistente > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {statusCounts.desistente} Desistente{statusCounts.desistente > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {statusCounts.inativo > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {statusCounts.inativo} Inativo{statusCounts.inativo > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classGroup.students.map((student) => (
                      <MatriculaCard
                        key={student.enrollmentId}
                        student={student}
                        onStatusChange={onStatusChange}
                        onRemove={onRemove}
                        selectable={!!onStudentSelect}
                        selected={selectedStudents.includes(student.enrollmentId)}
                        onSelect={onStudentSelect}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}