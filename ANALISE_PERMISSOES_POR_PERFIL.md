# 🔐 ANÁLISE DE PERMISSÕES POR PERFIL - Sistema MIEADI

## 📋 VISÃO GERAL DOS PERFIS E PERMISSÕES

O sistema MIEADI implementa controle de acesso baseado em **Row Level Security (RLS)** do Supabase, com 7 perfis distintos e permissões granulares por tabela.

---

## 👑 **PERFIL: ADMIN**

### ✅ **PERMISSÕES COMPLETAS (ALL)**
- `admin_logs` - Visualizar logs administrativos
- `approval_workflows` - Gerenciar workflows de aprovação 
- `assessment_questions` - Gerenciar questões de avaliação
- `assessment_submissions` - Visualizar submissões de avaliação
- `assessments` - Gerenciar avaliações
- `attendance_receipts` - Gerenciar todos os recibos
- `attendance_records` - Gerenciar registros de presença
- `attendances` - Gerenciar todas as presenças
- `audit_logs` - Visualizar logs de auditoria
- `auto_billing_executions` - Visualizar execuções de cobrança
- `auto_billing_rules` - Gerenciar regras de cobrança automática
- `certificates` - Gerenciar certificados
- `class_materials` - Gerenciar materiais de aula
- `class_schedules` - Gerenciar horários de aula
- `class_sessions` - Gerenciar sessões de aula
- `class_subjects` - Gerenciar disciplinas das turmas
- `classes` - Gerenciar todas as turmas
- `congregations` - Gerenciar congregações
- `courses` - Gerenciar cursos
- `enrollments` - Gerenciar matrículas
- `events` - Gerenciar eventos
- `fields` - Gerenciar campos
- `grades` - Gerenciar notas
- `materials` - Gerenciar materiais
- `member_indications` - Gerenciar indicações de membros
- `member_requests` - Gerenciar solicitações de membros
- `notifications` - Gerenciar todas as notificações
- `payments` - Gerenciar pagamentos

### 🎯 **CAPACIDADES ESPECIAIS**
- Acesso total ao sistema
- Controle de configurações
- Gestão de usuários e perfis
- Relatórios completos
- Auditoria do sistema

---

## 🎯 **PERFIL: COORDENADOR**

### ✅ **PERMISSÕES SIMILARES AO ADMIN**
- **Herda TODAS as permissões do Admin** na maioria das tabelas
- Mesmo nível de acesso para gestão acadêmica
- Capacidade de aprovar workflows

### 🎯 **CAPACIDADES ESPECÍFICAS**
- Coordenação acadêmica
- Aprovação de planejamentos
- Gestão de professores
- Relatórios gerenciais
- Controle de qualidade acadêmica

---

## 👨‍🏫 **PERFIL: PROFESSOR**

### ✅ **PERMISSÕES DE LEITURA (SELECT)**
- `classes` - Suas turmas apenas
- `enrollments` - Alunos de suas turmas
- `events` - Eventos de suas turmas
- `materials` - Materiais que criou + públicos
- `notifications` - Suas notificações

### ✅ **PERMISSÕES DE GESTÃO (ALL/INSERT/UPDATE)**
- `assessment_questions` - Questões de suas avaliações
- `assessments` - Avaliações de suas turmas
- `attendance_receipts` - Recibos de suas turmas
- `attendance_records` - Presença de suas turmas
- `attendances` - Frequência de suas turmas
- `class_materials` - Materiais de suas turmas
- `class_schedules` - Horários de suas turmas
- `class_sessions` - Sessões de suas turmas
- `class_subjects` - Disciplinas de suas turmas
- `classes` - Apenas suas turmas
- `events` - Eventos de suas turmas
- `grades` - Notas de suas turmas
- `materials` - Seus materiais

### 🚫 **RESTRIÇÕES**
- Não pode acessar turmas de outros professores
- Não pode gerenciar configurações do sistema
- Não pode aprovar workflows administrativos

---

## 📋 **PERFIL: SECRETÁRIO**

### ✅ **PERMISSÕES ADMINISTRATIVAS**
- `courses` - Gerenciar cursos (ALL)
- `attendances` - Inserir frequência
- Acesso limitado para funções administrativas específicas

### 🎯 **CAPACIDADES ESPECÍFICAS**
- Gestão de matrículas
- Emissão de certificados
- Relatórios administrativos
- Controle de documentação

---

## 🎓 **PERFIL: ALUNO/STUDENT**

### ✅ **PERMISSÕES DE LEITURA (SELECT)**
- `assessment_questions` - Questões de avaliações publicadas
- `assessments` - Avaliações publicadas de suas turmas
- `attendance_receipts` - Seus próprios recibos
- `attendance_records` - Seus registros de presença
- `attendances` - Sua própria frequência
- `certificates` - Seus próprios certificados
- `class_materials` - Materiais de suas turmas
- `class_schedules` - Horários de suas turmas
- `class_sessions` - Sessões de suas turmas
- `class_subjects` - Disciplinas de suas turmas
- `classes` - Suas turmas apenas
- `courses` - Cursos disponíveis
- `enrollments` - Suas próprias matrículas
- `events` - Eventos de suas turmas
- `grades` - Suas próprias notas
- `materials` - Materiais públicos + de suas disciplinas
- `notifications` - Suas notificações
- `payments` - Seus pagamentos

### ✅ **PERMISSÕES DE GESTÃO LIMITADA**
- `assessment_submissions` - Suas submissões (ALL)
- `attendances` - Inserir própria presença
- `notifications` - Atualizar status de leitura

### 🚫 **RESTRIÇÕES**
- Não pode acessar dados de outros alunos
- Não pode criar/modificar avaliações
- Não pode gerenciar turmas ou cursos
- Acesso somente leitura na maioria das tabelas

---

## 💒 **PERFIL: MEMBRO**

### ✅ **PERMISSÕES BÁSICAS**
- `member_indications` - Criar e ver próprias indicações
- `notifications` - Suas notificações
- Acesso limitado ao sistema eclesiástico

### 🎯 **CAPACIDADES ESPECÍFICAS**
- Participação em atividades da igreja
- Indicação de novos membros
- Acesso a informações da congregação

---

## ⛪ **PERFIL: PASTOR**

### ✅ **PERMISSÕES ECLESIÁSTICAS**
- Gestão de membros da congregação
- Aprovação de solicitações
- Relatórios ministeriais

*Nota: Permissões específicas ainda sendo implementadas*

---

## 🔍 **ANÁLISE DE SEGURANÇA POR TABELA**

### 📊 **TABELAS COM CONTROLE RIGOROSO**
- `admin_logs` - Apenas admins
- `audit_logs` - Apenas admins
- `auto_billing_executions` - Apenas admins/coordenadores
- `auto_billing_rules` - Apenas admins/coordenadores

### 👥 **TABELAS COM ACESSO MULTINÍVEL**
- `classes` - Admin/Coordenador (ALL), Professor (suas), Aluno (suas)
- `assessments` - Admin/Coordenador/Professor (gestão), Aluno (leitura)
- `grades` - Professor (gestão), Aluno (próprias)
- `attendances` - Professor (gestão), Aluno (própria)

### 🌐 **TABELAS PÚBLICAS/COMPARTILHADAS**
- `congregations` - Leitura para todos
- `courses` - Leitura para autenticados
- `fields` - Leitura para todos

---

## 🚨 **PROBLEMAS DE SEGURANÇA IDENTIFICADOS**

### 1. **TABELAS SEM RLS IMPLEMENTADA**
```sql
-- Verificar se existem tabelas sem RLS ativo
```

### 2. **POLÍTICAS MUITO PERMISSIVAS**
- Algumas políticas usam `true` como condição
- Verificar necessidade de restrições mais específicas

### 3. **FALTA DE AUDITORIA**
- Nem todas as tabelas têm triggers de auditoria
- Logs incompletos para ações críticas

### 4. **PERMISSÕES INCONSISTENTES**
- Professor vs Coordenador em algumas tabelas
- Secretário com permissões limitadas vs necessidades reais

---

## 📋 **RECOMENDAÇÕES DE MELHORIA**

### 🔒 **SEGURANÇA**
1. **Implementar auditoria completa** em todas as tabelas críticas
2. **Revisar políticas muito permissivas** (condições `true`)
3. **Adicionar timeouts de sessão** para perfis administrativos
4. **Implementar log de tentativas de acesso negado**

### 🎯 **FUNCIONALIDADE**
1. **Expandir permissões do Secretário** conforme necessidades reais
2. **Implementar permissões específicas do Pastor**
3. **Criar sistema de delegação** de permissões temporárias
4. **Adicionar controle de IP** para admins

### 🔄 **MANUTENIBILIDADE**
1. **Criar funções auxiliares** para verificação de permissões
2. **Padronizar nomenclatura** das políticas RLS
3. **Documentar exceções** e casos especiais
4. **Implementar testes automatizados** para RLS

---

## 🎯 **PRÓXIMOS PASSOS**

### **PRIORIDADE ALTA**
- [ ] Implementar RLS em tabelas faltantes
- [ ] Revisar políticas muito permissivas
- [ ] Adicionar auditoria em tabelas críticas
- [ ] Testar bypass de segurança

### **PRIORIDADE MÉDIA**
- [ ] Expandir permissões do Pastor
- [ ] Melhorar permissões do Secretário
- [ ] Implementar delegação de permissões
- [ ] Criar relatórios de acesso

### **PRIORIDADE BAIXA**
- [ ] Otimizar consultas RLS
- [ ] Implementar cache de permissões
- [ ] Adicionar métricas de segurança
- [ ] Criar interface de gestão de permissões

---

## 📊 **RESUMO EXECUTIVO**

| Perfil | Tabelas Acessíveis | Nível de Acesso | Riscos | Status |
|--------|-------------------|-----------------|---------|---------|
| **Admin** | 25+ | Completo | Baixo | ✅ Implementado |
| **Coordenador** | 25+ | Quase Completo | Baixo | ✅ Implementado |
| **Professor** | 15+ | Contextual | Médio | ✅ Implementado |
| **Secretário** | 8+ | Limitado | Médio | ⚠️ Incompleto |
| **Aluno** | 12+ | Somente Próprios | Baixo | ✅ Implementado |
| **Membro** | 3+ | Básico | Baixo | ⚠️ Básico |
| **Pastor** | 2+ | Mínimo | Alto | 🚨 Não Implementado |

**Conclusão:** O sistema possui uma base sólida de RLS, mas precisa de refinamentos específicos por perfil e implementação completa para Pastor e melhorias para Secretário.