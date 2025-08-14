import { supabase } from '@/integrations/supabase/client';

/**
 * Função utilitária para testar a configuração de PIN
 * Use no console do navegador: testPinSetup('04816954350', '1234')
 */
export const testPinSetup = async (cpf: string, pin: string) => {
  console.log('🔄 Testando configuração de PIN...');
  console.log('CPF:', cpf);
  console.log('PIN:', pin);
  
  try {
    const { data, error } = await supabase.rpc('set_user_pin', {
      input_cpf: cpf,
      new_pin: parseInt(pin)
    });
    
    console.log('📊 Resultado:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error('❌ Erro na chamada RPC:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Função RPC executada com sucesso');
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ Erro na chamada:', err);
    return { success: false, error: err };
  }
};

/**
 * Função utilitária para testar a verificação de PIN
 * Use no console do navegador: testPinVerification('04816954350', '1234')
 */
export const testPinVerification = async (cpf: string, pin: string) => {
  console.log('🔄 Testando verificação de PIN...');
  console.log('CPF:', cpf);
  console.log('PIN:', pin);
  
  try {
    const { data, error } = await supabase.rpc('verify_user_pin', {
      cpf_input: cpf,
      pin_input: pin
    });
    
    console.log('📊 Resultado:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error('❌ Erro na chamada RPC:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Função RPC executada com sucesso');
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ Erro na chamada:', err);
    return { success: false, error: err };
  }
};

// Função para testar diretamente uma chamada da função RPC
export const testDirectRPC = async () => {
  console.log('🔄 Testando chamada direta da RPC...');
  
  try {
    const { data, error } = await supabase.rpc('set_user_pin', {
      input_cpf: '04816954350',
      new_pin: 1234
    });
    
    console.log('📊 Resultado direto:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    return { data, error };
  } catch (err) {
    console.error('❌ Erro na chamada direta:', err);
    return { error: err };
  }
};

// Expor globalmente para facilitar os testes
(window as any).testPinSetup = testPinSetup;
(window as any).testPinVerification = testPinVerification;
(window as any).testDirectRPC = testDirectRPC;