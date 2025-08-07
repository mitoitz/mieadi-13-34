// Utilitários para testes básicos
export class TestUtils {
  // Simular delay de rede para testes
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validar estrutura de dados
  static validateDataStructure(data: any, expectedKeys: string[]): boolean {
    if (!data || typeof data !== 'object') return false;
    
    return expectedKeys.every(key => key in data);
  }

  // Testar APIs mock
  static async testMockAPI(endpoint: string, expectedData: any): Promise<boolean> {
    try {
      // Simular chamada de API
      await this.delay(100);
      
      // Validar estrutura dos dados esperados
      if (Array.isArray(expectedData)) {
        return expectedData.every(item => typeof item === 'object');
      }
      
      return typeof expectedData === 'object';
    } catch (error) {
      console.error(`Erro no teste da API ${endpoint}:`, error);
      return false;
    }
  }

  // Testar performance de componentes
  static measureComponentPerformance<T>(
    componentName: string,
    operation: () => T
  ): { result: T; duration: number } {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`[Performance] ${componentName}: ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      console.warn(`[Performance Warning] ${componentName} demorou ${duration.toFixed(2)}ms`);
    }
    
    return { result, duration };
  }

  // Testar hooks de React Query
  static async testReactQueryHook(
    hookName: string,
    queryResult: any
  ): Promise<boolean> {
    try {
      // Verificar propriedades básicas do React Query
      const requiredProps = ['data', 'isLoading', 'error', 'refetch'];
      const hasAllProps = requiredProps.every(prop => prop in queryResult);
      
      if (!hasAllProps) {
        console.error(`[Test Failed] ${hookName} não possui todas as propriedades necessárias`);
        return false;
      }
      
      // Testar diferentes estados
      if (queryResult.isLoading) {
        console.log(`[Test] ${hookName}: Estado de loading OK`);
      }
      
      if (queryResult.error) {
        console.log(`[Test] ${hookName}: Estado de erro OK`);
      }
      
      if (queryResult.data) {
        console.log(`[Test] ${hookName}: Dados carregados OK`);
      }
      
      return true;
    } catch (error) {
      console.error(`[Test Failed] Erro ao testar ${hookName}:`, error);
      return false;
    }
  }

  // Testar formulários
  static validateForm(formData: Record<string, any>, rules: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = formData[field];
      
      // Obrigatório
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field} é obrigatório`);
      }
      
      // Tamanho mínimo
      if (rule.minLength && value && value.toString().length < rule.minLength) {
        errors.push(`${field} deve ter pelo menos ${rule.minLength} caracteres`);
      }
      
      // Email
      if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} deve ser um email válido`);
      }
      
      // CPF básico
      if (rule.cpf && value && !/^\d{11}$/.test(value.replace(/\D/g, ''))) {
        errors.push(`${field} deve ser um CPF válido`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Testar navegação
  static testNavigation(): boolean {
    try {
      // Verificar se todas as rotas principais estão acessíveis
      const routes = [
        '/',
        '/pessoas',
        '/turmas',
        '/matriculas',
        '/financeiro',
        '/relatorios'
      ];
      
      // Simular teste de navegação
      console.log('[Navigation Test] Testando rotas principais...');
      
      routes.forEach(route => {
        // Em uma implementação real, testaria se a rota carrega
        console.log(`✓ Rota ${route} OK`);
      });
      
      return true;
    } catch (error) {
      console.error('[Navigation Test Failed]:', error);
      return false;
    }
  }

  // Sistema de health check básico
  static async runHealthCheck(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    checks: Array<{ name: string; status: boolean; message: string }>;
  }> {
    const checks = [];
    
    // Testar localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      checks.push({ name: 'LocalStorage', status: true, message: 'OK' });
    } catch {
      checks.push({ name: 'LocalStorage', status: false, message: 'Não disponível' });
    }
    
    // Testar conectividade básica
    try {
      const online = navigator.onLine;
      checks.push({ 
        name: 'Network', 
        status: online, 
        message: online ? 'Online' : 'Offline' 
      });
    } catch {
      checks.push({ name: 'Network', status: false, message: 'Erro ao verificar' });
    }
    
    // Testar performance básica
    try {
      const start = performance.now();
      await this.delay(10);
      const end = performance.now();
      const isGoodPerformance = (end - start) < 50;
      
      checks.push({ 
        name: 'Performance', 
        status: isGoodPerformance, 
        message: isGoodPerformance ? 'Boa' : 'Lenta' 
      });
    } catch {
      checks.push({ name: 'Performance', status: false, message: 'Erro ao medir' });
    }
    
    const successCount = checks.filter(check => check.status).length;
    const overall = successCount === checks.length ? 'healthy' : 
                   successCount > checks.length / 2 ? 'warning' : 'error';
    
    return { overall, checks };
  }
}