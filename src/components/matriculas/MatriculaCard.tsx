
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User, BookOpen, Calendar, Check, X, Clock, MoreHorizontal, UserMinus, UserX, Archive, CheckCircle, Repeat } from "lucide-react";
import { StudentData } from "@/services/matriculas.service";

interface MatriculaCardProps {
  student: StudentData;
  onStatusChange?: (enrollmentId: string, status: string) => void;
  onRemove?: (enrollmentId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (enrollmentId: string, selected: boolean) => void;
}

export function MatriculaCard({ 
  student, 
  onStatusChange, 
  onRemove, 
  selectable = false, 
  selected = false, 
  onSelect 
}: MatriculaCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'desistente': return 'bg-orange-100 text-orange-800';
      case 'transferido': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'pendente': return 'Pendente';
      case 'desistente': return 'Desistente';
      case 'transferido': return 'Transferido';
      case 'concluido': return 'Concluído';
      default: return 'Indefinido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <Check className="h-4 w-4" />;
      case 'inativo': return <X className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'desistente': return <UserMinus className="h-4 w-4" />;
      case 'transferido': return <Repeat className="h-4 w-4" />;
      case 'concluido': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(student.enrollmentId, newStatus);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(student.enrollmentId);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectable && (
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect?.(student.enrollmentId, e.target.checked)}
                className="h-4 w-4"
              />
            )}
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {student.nome}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(student.status)}>
              {getStatusIcon(student.status)}
              <span className="ml-1">{getStatusText(student.status)}</span>
            </Badge>
            {(onStatusChange || onRemove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange('ativo')}>
                    <Check className="mr-2 h-4 w-4" />
                    Marcar como Ativo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('inativo')}>
                    <X className="mr-2 h-4 w-4" />
                    Marcar como Inativo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('pendente')}>
                    <Clock className="mr-2 h-4 w-4" />
                    Marcar como Pendente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('desistente')}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Marcar como Desistente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('transferido')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Marcar como Transferido
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('concluido')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Concluído
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleRemove}
                    className="text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Remover Matrícula
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {student.turma}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          Curso: {student.curso}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Matrícula: {student.dataMatricula}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Média:</span>
          <Badge variant="outline">{student.media.toFixed(1)}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Frequência:</span>
          <Badge variant="outline">{student.frequencia.toFixed(1)}%</Badge>
        </div>
        {student.congregacao && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Congregação:</span>
            {student.congregacao}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
