import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X, Clock, UserMinus, Repeat, CheckCircle, UserX, ChevronDown } from "lucide-react";
import { useState } from "react";

interface BulkMatriculaActionsProps {
  selectedCount: number;
  onBulkStatusChange: (status: string) => void;
  onBulkRemove: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  classFilter: string;
  onClassFilterChange: (classId: string) => void;
  classes: Array<{ id: string; name: string; }>;
}

export function BulkMatriculaActions({
  selectedCount,
  onBulkStatusChange,
  onBulkRemove,
  onSelectAll,
  onClearSelection,
  classFilter,
  onClassFilterChange,
  classes
}: BulkMatriculaActionsProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const statusOptions = [
    { value: 'ativo', label: 'Ativo', icon: Check },
    { value: 'inativo', label: 'Inativo', icon: X },
    { value: 'pendente', label: 'Pendente', icon: Clock },
    { value: 'desistente', label: 'Desistente', icon: UserMinus },
    { value: 'transferido', label: 'Transferido', icon: Repeat },
    { value: 'concluido', label: 'Concluído', icon: CheckCircle },
  ];

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
        >
          Selecionar Todos
        </Button>
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
          >
            Limpar Seleção
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar por turma:</span>
        <Select value={classFilter} onValueChange={onClassFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
          </Badge>
          
          <DropdownMenu open={isActionsOpen} onOpenChange={setIsActionsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ações em Massa
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Alterar Status</div>
              {statusOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => {
                    onBulkStatusChange(option.value);
                    setIsActionsOpen(false);
                  }}
                >
                  <option.icon className="mr-2 h-4 w-4" />
                  Marcar como {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  onBulkRemove();
                  setIsActionsOpen(false);
                }}
                className="text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                Remover Todas as Matrículas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}