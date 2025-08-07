
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, Edit, Trash2, Pause, MoreVertical } from "lucide-react";
import { TurmaDetailsDialog } from "./TurmaDetailsDialog";
import { useState } from "react";
import { useDeleteTurma, useDeactivateTurma } from "@/hooks/useTurmas";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Turma {
  id: string;
  name: string;
  subject: string;
  professor: string;
  students_count: number;
  schedule: string;
  status: 'active' | 'inactive' | 'completed' | 'ativa' | 'inativa' | 'concluida';
  created_at: string;
  subjects_count?: number;
}

interface TurmaCardProps {
  turma: Turma;
  onDeleted?: () => void;
}

export function TurmaCard({ turma, onDeleted }: TurmaCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const deleteTurma = useDeleteTurma();
  const deactivateTurma = useDeactivateTurma();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': 
      case 'ativa': return 'Ativa';
      case 'inactive': 
      case 'inativa': return 'Inativa';
      case 'completed': 
      case 'concluida': return 'Concluída';
      default: return 'Indefinido';
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir a turma "${turma.name}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmed) return;

    try {
      await deleteTurma.mutateAsync(turma.id);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting turma:', error);
      // O erro já é mostrado pelo hook useTurmas
    }
  };

  const handleDeactivate = async () => {
    const confirmed = window.confirm(`Tem certeza que deseja desativar a turma "${turma.name}"?`);
    
    if (!confirmed) return;

    try {
      await deactivateTurma.mutateAsync(turma.id);
      onDeleted?.();
    } catch (error) {
      console.error('Error deactivating turma:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{turma.name}</CardTitle>
          <Badge className={getStatusColor(turma.status)}>
            {getStatusText(turma.status)}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {turma.subject}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Professor: {turma.professor}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {turma.students_count} alunos
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {turma.schedule}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(true)}
          >
            Ver Detalhes
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setShowDetails(true);
              setEditMode(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={deleteTurma.isPending || deactivateTurma.isPending}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {turma.status === 'ativa' && (
                <DropdownMenuItem 
                  onClick={handleDeactivate}
                  className="text-yellow-600"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Desativar Turma
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Turma
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TurmaDetailsDialog 
          turmaId={turma.id} 
          isOpen={showDetails} 
          onClose={() => {
            setShowDetails(false);
            setEditMode(false);
          }}
          onEdit={() => setEditMode(true)}
          editMode={editMode}
        />
      </CardContent>
    </Card>
  );
}
