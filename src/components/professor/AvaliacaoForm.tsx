import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvaliacaoFormProps {
  isOpen: boolean;
  onClose: () => void;
  professorId: string;
  turmas: any[];
  onSuccess: () => void;
}

interface Questao {
  id: string;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "dissertativa";
  pergunta: string;
  opcoes?: string[];
  resposta_correta?: string;
  pontuacao: number;
}

export function AvaliacaoForm({ isOpen, onClose, professorId, turmas, onSuccess }: AvaliacaoFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [dataAplicacao, setDataAplicacao] = useState("");
  const [tempoLimite, setTempoLimite] = useState("");
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  
  // Current question being edited
  const [questaoAtual, setQuestaoAtual] = useState<Questao>({
    id: "",
    tipo: "multipla_escolha",
    pergunta: "",
    opcoes: ["", "", "", ""],
    resposta_correta: "",
    pontuacao: 1
  });

  const adicionarQuestao = () => {
    if (!questaoAtual.pergunta.trim()) {
      toast.error("Digite a pergunta");
      return;
    }

    if (questaoAtual.tipo === "multipla_escolha" && !questaoAtual.opcoes?.every(op => op.trim())) {
      toast.error("Preencha todas as opções");
      return;
    }

    if (!questaoAtual.resposta_correta) {
      toast.error("Defina a resposta correta");
      return;
    }

    const novaQuestao = {
      ...questaoAtual,
      id: Date.now().toString()
    };

    setQuestoes([...questoes, novaQuestao]);
    setQuestaoAtual({
      id: "",
      tipo: "multipla_escolha",
      pergunta: "",
      opcoes: ["", "", "", ""],
      resposta_correta: "",
      pontuacao: 1
    });
  };

  const removerQuestao = (id: string) => {
    setQuestoes(questoes.filter(q => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo || !turmaId || questoes.length === 0) {
      toast.error("Preencha todos os campos obrigatórios e adicione pelo menos uma questão");
      return;
    }

    try {
      setLoading(true);

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          title: titulo,
          description: descricao,
          class_id: turmaId,
          start_date: dataAplicacao ? new Date(dataAplicacao).toISOString() : null,
          duration_minutes: tempoLimite ? parseInt(tempoLimite) : null,
          professor_id: professorId,
          status: 'draft'
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create questions
      for (const questao of questoes) {
        const { error: questionError } = await supabase
          .from('assessment_questions')
          .insert({
            assessment_id: assessment.id,
            question_text: questao.pergunta,
            question_type: questao.tipo,
            options: questao.opcoes ? JSON.stringify(questao.opcoes) : null,
            correct_answer: questao.resposta_correta,
            points: questao.pontuacao,
            order_index: questoes.indexOf(questao)
          });

        if (questionError) throw questionError;
      }

      toast.success("Avaliação criada com sucesso!");
      onSuccess();
      
      // Reset form
      setTitulo("");
      setDescricao("");
      setTurmaId("");
      setDataAplicacao("");
      setTempoLimite("");
      setQuestoes([]);
      
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error("Erro ao criar avaliação");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestaoOpcao = (index: number, value: string) => {
    const novasOpcoes = [...(questaoAtual.opcoes || [])];
    novasOpcoes[index] = value;
    setQuestaoAtual({
      ...questaoAtual,
      opcoes: novasOpcoes
    });
  };

  const totalPontos = questoes.reduce((total, q) => total + q.pontuacao, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Avaliação *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Prova - Módulo 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="turma">Turma *</Label>
              <Select value={turmaId} onValueChange={setTurmaId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data de Aplicação</Label>
              <Input
                id="data"
                type="datetime-local"
                value={dataAplicacao}
                onChange={(e) => setDataAplicacao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo Limite (minutos)</Label>
              <Input
                id="tempo"
                type="number"
                value={tempoLimite}
                onChange={(e) => setTempoLimite(e.target.value)}
                placeholder="Ex: 60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Instruções para os alunos..."
              rows={3}
            />
          </div>

          {/* Questions List */}
          {questoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Questões Adicionadas ({questoes.length})
                  <Badge variant="secondary">{totalPontos} pontos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questoes.map((questao, index) => (
                  <div key={questao.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{questao.tipo.replace('_', ' ')}</Badge>
                          <Badge variant="secondary">{questao.pontuacao} pts</Badge>
                        </div>
                        <p className="font-medium mb-2">{index + 1}. {questao.pergunta}</p>
                        {questao.opcoes && (
                          <div className="ml-4 space-y-1">
                            {questao.opcoes.map((opcao, i) => (
                              <p key={i} className={`text-sm ${questao.resposta_correta === opcao ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                {String.fromCharCode(97 + i)}) {opcao}
                              </p>
                            ))}
                          </div>
                        )}
                        {questao.tipo === "dissertativa" && (
                          <p className="text-sm text-muted-foreground ml-4">
                            Resposta esperada: {questao.resposta_correta}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removerQuestao(questao.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* New Question Form */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Questão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Questão</Label>
                  <Select 
                    value={questaoAtual.tipo} 
                    onValueChange={(value: "multipla_escolha" | "verdadeiro_falso" | "dissertativa") => 
                      setQuestaoAtual({...questaoAtual, tipo: value, opcoes: value === "multipla_escolha" ? ["", "", "", ""] : value === "verdadeiro_falso" ? ["Verdadeiro", "Falso"] : undefined})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                      <SelectItem value="verdadeiro_falso">Verdadeiro/Falso</SelectItem>
                      <SelectItem value="dissertativa">Dissertativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pontuação</Label>
                  <Input
                    type="number"
                    min="1"
                    value={questaoAtual.pontuacao}
                    onChange={(e) => setQuestaoAtual({...questaoAtual, pontuacao: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pergunta</Label>
                <Textarea
                  value={questaoAtual.pergunta}
                  onChange={(e) => setQuestaoAtual({...questaoAtual, pergunta: e.target.value})}
                  placeholder="Digite a pergunta..."
                  rows={3}
                />
              </div>

              {questaoAtual.tipo === "multipla_escolha" && (
                <div className="space-y-4">
                  <Label>Opções de Resposta</Label>
                  {questaoAtual.opcoes?.map((opcao, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-8 text-sm font-medium">
                        {String.fromCharCode(97 + index)})
                      </span>
                      <Input
                        value={opcao}
                        onChange={(e) => updateQuestaoOpcao(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                      />
                    </div>
                  ))}
                  
                  <div className="space-y-2">
                    <Label>Resposta Correta</Label>
                    <RadioGroup
                      value={questaoAtual.resposta_correta}
                      onValueChange={(value) => setQuestaoAtual({...questaoAtual, resposta_correta: value})}
                    >
                      {questaoAtual.opcoes?.map((opcao, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={opcao} id={`opcao-${index}`} />
                          <Label htmlFor={`opcao-${index}`}>
                            {String.fromCharCode(97 + index)}) {opcao}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              )}

              {questaoAtual.tipo === "verdadeiro_falso" && (
                <div className="space-y-2">
                  <Label>Resposta Correta</Label>
                  <RadioGroup
                    value={questaoAtual.resposta_correta}
                    onValueChange={(value) => setQuestaoAtual({...questaoAtual, resposta_correta: value})}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Verdadeiro" id="verdadeiro" />
                      <Label htmlFor="verdadeiro">Verdadeiro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Falso" id="falso" />
                      <Label htmlFor="falso">Falso</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {questaoAtual.tipo === "dissertativa" && (
                <div className="space-y-2">
                  <Label>Resposta Esperada/Critérios</Label>
                  <Textarea
                    value={questaoAtual.resposta_correta}
                    onChange={(e) => setQuestaoAtual({...questaoAtual, resposta_correta: e.target.value})}
                    placeholder="Descreva a resposta esperada ou critérios de correção..."
                    rows={3}
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={adicionarQuestao}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Questão
              </Button>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || questoes.length === 0}>
              {loading ? "Criando..." : "Criar Avaliação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}