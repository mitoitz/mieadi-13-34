import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar nosso valor
  // Passar função inicial para useState para que a lógica seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Obter item do localStorage pela key
      const item = window.localStorage.getItem(key);
      // Analisar JSON armazenado ou, se nenhum, retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se erro também retornar initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Retornar uma versão envolvida da função setter do useState que persiste o novo valor no localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função para ter a mesma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Salvar no state
      setStoredValue(valueToStore);
      // Salvar no localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Um case mais avançado seria para lidar com o localStorage estar cheio
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}