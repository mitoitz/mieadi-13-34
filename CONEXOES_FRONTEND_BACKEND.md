# Conexões Frontend-Backend - Sistema MIEADI

## ✅ STATUS: SISTEMA TOTALMENTE CONECTADO

O sistema MIEADI está completamente conectado ao banco de dados Supabase, com todas as principais funcionalidades operando através de serviços dedicados.

## 🔗 Configuração de Conexão

### Banco de Dados
- **Projeto**: `hxpccmysywktfknuccyn` (Igreja)
- **URL**: `https://hxpccmysywktfknuccyn.supabase.co`
- **Status**: ✅ Conectado e funcional

### Cliente Supabase
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## 📋 Serviços Implementados e Conectados

### 1. Gestão de Pessoas (`pessoas.service.ts`)
- **Tabela**: `profiles`
- **Funcionalidades**:
  - ✅ Listar pessoas com relações (congregações, campos, cursos)
  - ✅ Criar novas pessoas
  - ✅ Atualizar dados pessoais
  - ✅ Deletar registros
  - ✅ Busca por nome e filtros
- **Página**: `/pessoas` - Totalmente funcional

### 2. Cursos (`cursos.service.ts`)
- **Tabela**: `courses`
- **Funcionalidades**:
  - ✅ CRUD completo de cursos
  - ✅ Listagem com estatísticas
  - ✅ Filtros e busca
- **Página**: `/cursos` - Totalmente funcional

### 3. Disciplinas (`disciplinas.service.ts`)
- **Tabela**: `subjects`
- **Funcionalidades**:
  - ✅ CRUD de disciplinas
  - ✅ Relação com cursos e professores
  - ✅ Gestão de créditos
- **Página**: `/disciplinas` - Totalmente funcional

### 4. Congregações (`congregacoes.service.ts`)
- **Tabela**: `congregations`
- **Funcionalidades**:
  - ✅ Gestão completa de congregações
  - ✅ Dados de localização e contato
  - ✅ Atribuição de pastores
- **Página**: `/congregacoes` - Totalmente funcional

### 5. Campos (`campos.service.ts`)
- **Tabela**: `fields`
- **Funcionalidades**:
  - ✅ Gestão de campos ministeriais
  - ✅ Atribuição de responsáveis
- **Página**: `/campos` - Totalmente funcional

### 6. Turmas (`turmas.service.ts`)
- **Tabela**: `classes`
- **Funcionalidades**:
  - ✅ Gestão de turmas
  - ✅ Relação com disciplinas e professores
  - ✅ Controle de matrículas
- **Página**: `/turmas` - Totalmente funcional

### 7. Matrículas (`matriculas.service.ts`)
- **Tabela**: `enrollments`
- **Funcionalidades**:
  - ✅ Gestão de matrículas de alunos
  - ✅ Status de matrícula
  - ✅ Relação com cursos e turmas
- **Página**: `/matriculas` - Totalmente funcional

### 8. Sistema Financeiro (`financial.service.ts`)
- **Tabela**: `tuition_fees`
- **Funcionalidades**:
  - ✅ Gestão de mensalidades
  - ✅ Controle de pagamentos
  - ✅ Relatórios financeiros
- **Página**: `/financeiro` - Funcional

### 9. Notificações (`notifications.service.ts`)
- **Tabela**: `notifications`
- **Funcionalidades**:
  - ✅ Sistema de notificações
  - ✅ Marcar como lido
  - ✅ Notificações bulk
- **Integração**: Componente global

### 10. Frequência e Presença (`sessions.service.ts`)
- **Tabelas**: `class_sessions`, `attendances`
- **Funcionalidades**:
  - ✅ Controle de sessões de aula
  - ✅ Registro de frequência
  - ✅ Relatórios de presença
- **Páginas**: `/frequencia`, `/gerenciar-frequencias`

## 🔐 Sistema de Autenticação

### Autenticação por CPF
- **Componente**: `CPFLoginForm.tsx`
- **Funcionalidades**:
  - ✅ Login via CPF
  - ✅ Validação de dados
  - ✅ Sistema 2FA opcional
  - ✅ Termos de uso

### Hook de Autenticação
- **Hook**: `useAuth.ts`
- **Funcionalidades**:
  - ✅ Gerenciamento de sessão
  - ✅ Persistência localStorage
  - ✅ Controle de estado global
  - ✅ Logout automático

## 🛡️ Segurança e Políticas RLS

Todas as tabelas possuem Row Level Security (RLS) configurado:

- ✅ **Profiles**: Controle por usuário e role
- ✅ **Courses**: Apenas admins podem gerenciar
- ✅ **Classes**: Professores veem suas turmas
- ✅ **Enrollments**: Alunos veem suas matrículas
- ✅ **Notifications**: Usuários veem apenas suas notificações
- ✅ **Attendances**: Controle por classe e professor

## 📊 Dashboards por Perfil

### Administrador
- **Componente**: `MieadiDashboard`
- **Funcionalidades**: Visão completa do sistema

### Professor
- **Componente**: `ProfessorDashboard`
- **Funcionalidades**: Turmas, alunos, avaliações

### Aluno
- **Componente**: `AlunoDashboard`
- **Funcionalidades**: Notas, frequência, materiais

### Pastor
- **Componente**: `PastorDashboard`
- **Funcionalidades**: Congregação, membros, relatórios

### Coordenador/Secretário
- **Componentes**: Dashboards específicos
- **Funcionalidades**: Gestão acadêmica e administrativa

## 🔄 Sincronização em Tempo Real

O sistema está preparado para atualizações em tempo real através do Supabase Realtime:

```typescript
// Exemplo de uso em componentes
useEffect(() => {
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications'
    }, (payload) => {
      // Atualizar estado local
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

## 🚀 Próximos Passos

1. **✅ Concluído**: Conexão básica frontend-backend
2. **✅ Concluído**: Implementação dos serviços principais
3. **✅ Concluído**: Sistema de autenticação
4. **🔄 Em Andamento**: Relatórios avançados
5. **📋 Pendente**: Sistema de backup automático
6. **📋 Pendente**: Notificações push

## 📞 Suporte Técnico

O sistema está totalmente operacional e conectado. Todas as funcionalidades principais estão implementadas e testadas.

---

**Data de Atualização**: 30/07/2025
**Status**: ✅ SISTEMA OPERACIONAL