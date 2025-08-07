import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Test wrapper com providers
export function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Utility functions for tests
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  full_name: 'Usuário Teste',
  email: 'teste@mieadi.com',
  role: 'admin' as const,
  cpf: '123.456.789-00'
};

// Mock notification data
export const mockNotification = {
  id: 'test-notification-id',
  user_id: 'test-user-id',
  title: 'Teste Notificação',
  message: 'Esta é uma notificação de teste',
  type: 'info' as const,
  read: false,
  created_at: new Date().toISOString()
};

// Test utilities
export { describe, it, expect };