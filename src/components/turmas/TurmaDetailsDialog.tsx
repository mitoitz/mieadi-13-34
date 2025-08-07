import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Users, BookOpen, Calendar, Clock } from "lucide-react";
import { turmasService } from "@/services/turmas.service";
import { TurmaSubjectsManager } from "./TurmaSubjectsManager";

interface TurmaDetailsDialogProps {
  turmaId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  editMode?: boolean;
}

export function TurmaDetailsDialog({ turmaId, isOpen, onClose, onEdit, editMode = false }: TurmaDetailsDialogProps) {
  const [turma, setTurma] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [internalEditMode, setInternalEditMode] = useState(editMode);

  useEffect(() => {
    if (turmaId && isOpen) {
      loadTurma();
    }
  }, [turmaId, isOpen]);

  useEffect(() => {
    setInternalEditMode(editMode);
  }, [editMode]);

  const loadTurma = async () => {
    if (!turmaId) return;
    
    setLoading(true);
    try {
      const data = await turmasService.buscarPorId(turmaId);
      setTurma(data);
    } catch (error) {
      console.error('Error loading turma:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setInternalEditMode(true);
    onEdit?.();
  };

  const handleEditComplete = () => {
    setInternalEditMode(false);
    loadTurma();
  };

  if (!turmaId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {loading ? "Carregando..." : turma?.name || "Detalhes da Turma"}
            </span>
            {!internalEditMode && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="p-8 text-center">Carregando dados da turma...</div>
        ) : internalEditMode ? (
          <TurmaSubjectsManager 
            turmaId={turmaId} 
            onTurmaCreated={handleEditComplete}
          />
        ) : (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informações da Turma
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-lg font-semibold">{turma?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={
                      turma?.status === 'ativa' ? 'default' : 
                      turma?.status === 'concluida' ? 'secondary' : 'destructive'
                    }>
                      {turma?.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Professor</label>
                  <p>{turma?.profiles?.full_name || 'Não definido'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Máximo de Alunos</label>
                  <p>{turma?.max_students || 'Não definido'}</p>
                </div>
                {turma?.schedule && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Horário
                    </label>
                    <p>{turma.schedule}</p>
                  </div>
                )}
                {turma?.start_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Data de Início
                    </label>
                    <p>{new Date(turma.start_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Disciplinas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Disciplinas ({turma?.class_subjects?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {turma?.class_subjects && turma.class_subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {turma.class_subjects.map((classSubject: any) => (
                      <div key={classSubject.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {classSubject.subjects?.code ? 
                                `${classSubject.subjects.code} - ${classSubject.subjects.name}` : 
                                classSubject.subjects?.name || 'Disciplina não encontrada'
                              }
                            </h4>
                            {classSubject.subjects?.credits && (
                              <p className="text-sm text-muted-foreground">
                                {classSubject.subjects.credits} créditos
                              </p>
                            )}
                            {classSubject.subjects?.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {classSubject.subjects.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {classSubject.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Principal
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              #{classSubject.order_index + 1}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma disciplina associada à turma.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Alunos Matriculados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Alunos Matriculados ({turma?.enrollments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {turma?.enrollments && turma.enrollments.length > 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      {turma.enrollments.length} aluno(s) matriculado(s)
                    </p>
                    {/* Aqui poderia ter uma lista detalhada dos alunos */}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum aluno matriculado na turma.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}