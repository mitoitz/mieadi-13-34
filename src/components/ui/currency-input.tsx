import React, { useCallback } from 'react';
import { Input } from './input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
}

export function CurrencyInput({ value, onChange, currency = 'BRL', ...props }: CurrencyInputProps) {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(/[^0-9]/g, '');
    const numberValue = parseInt(rawValue) / 100;
    onChange(numberValue || 0);
  }, [onChange]);

  const formatValue = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  }, [currency]);

  return (
    <Input
      {...props}
      value={formatValue(value)}
      onChange={handleChange}
    />
  );
}