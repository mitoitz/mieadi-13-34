import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atualizar o valor debouncado após o delay especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelar o timeout se value mudar (também na desmontagem do componente)
    // Isso é como resetamos o timeout de debounce
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}