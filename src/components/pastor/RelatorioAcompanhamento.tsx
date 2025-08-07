import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BookOpen, 
  Star,
  Calendar,
  FileText,
  Download
} from "lucide-react";

interface ObreiroData {
  nome: string;
  cargo: string;
  progresso: number;
  media: number;
  frequencia: number;
  status: string;
  ultimaAula: string;
  proximaAvaliacao: string;
}

interface RelatorioAcompanhamentoProps {
  obreiros: ObreiroData[];
}

export function RelatorioAcompanhamento({ obreiros }: RelatorioAcompanhamentoProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excelente":
        return "bg-green-100 text-green-800 border-green-200";
      case "Bom":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Regular":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  const mediaGeral = obreiros.reduce((acc, obreiro) => acc + obreiro.media, 0) / obreiros.length;
  const frequenciaGeral = obreiros.reduce((acc, obreiro) => acc + obreiro.frequencia, 0) / obreiros.length;
  const progressoGeral = obreiros.reduce((acc, obreiro) => acc + obreiro.progresso, 0) / obreiros.length;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média Geral da Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{mediaGeral.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Frequência Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{frequenciaGeral.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{progressoGeral.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Individual dos Obreiros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório Individual dos Obreiros</CardTitle>
              <CardDescription>
                Acompanhamento detalhado do desempenho de cada obreiro no curso
              </CardDescription>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {obreiros.map((obreiro, index) => (
              <div key={index} className="p-6 border rounded-lg bg-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${obreiro.nome}`} />
                      <AvatarFallback>{obreiro.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{obreiro.nome}</h3>
                      <p className="text-muted-foreground">{obreiro.cargo}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(obreiro.status)}>
                    {obreiro.status}
                  </Badge>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progresso do Curso</span>
                      <span className={`text-sm font-bold ${getProgressColor(obreiro.progresso)}`}>
                        {obreiro.progresso}%
                      </span>
                    </div>
                    <Progress value={obreiro.progresso} className="h-2" />
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{obreiro.media}</div>
                    <div className="text-sm text-muted-foreground">Média Geral</div>
                    <div className="flex items-center justify-center mt-1">
                      {obreiro.media >= 8 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{obreiro.frequencia}%</div>
                    <div className="text-sm text-muted-foreground">Frequência</div>
                    <div className="flex items-center justify-center mt-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium">Status Geral</div>
                    <div className="text-lg font-bold mt-1">{obreiro.status}</div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Última aula:</strong> {obreiro.ultimaAula}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Próxima avaliação:</strong> {obreiro.proximaAvaliacao}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    Ver Histórico Completo
                  </Button>
                  <Button variant="outline" size="sm">
                    Relatório Detalhado
                  </Button>
                  <Button variant="outline" size="sm">
                    Enviar Feedback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}