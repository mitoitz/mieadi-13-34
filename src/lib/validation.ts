import { validateCPF } from "./auth";

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Brazilian format)
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

// Name validation
export function validateName(name: string): boolean {
  return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
}

// Date validation
export function validateDate(date: string): boolean {
  const dateObj = new Date(date);
  const now = new Date();
  const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
  
  return dateObj <= now && dateObj >= minAge;
}

// Generic form validation
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMemberRequest(data: {
  full_name: string;
  email: string;
  cpf?: string;
  phone?: string;
  birth_date?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!validateName(data.full_name)) {
    errors.push("Nome deve ter pelo menos 2 caracteres e conter apenas letras");
  }

  // Email validation
  if (!validateEmail(data.email)) {
    errors.push("Email deve ter um formato válido");
  }

  // CPF validation (if provided)
  if (data.cpf && !validateCPF(data.cpf)) {
    errors.push("CPF deve ter um formato válido");
  }

  // Phone validation (if provided)
  if (data.phone && !validatePhone(data.phone)) {
    errors.push("Telefone deve ter um formato válido");
  }

  // Birth date validation (if provided)
  if (data.birth_date && !validateDate(data.birth_date)) {
    errors.push("Data de nascimento deve ser válida");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/^\s+|\s+$/g, '') // Remove apenas espaços do início e fim
    .replace(/\s{2,}/g, ' '); // Reduz múltiplos espaços para um só
}

// Rate limiting helper (for client-side basic protection)
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier);

    if (!attempts) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempts.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if exceeded max attempts
    if (attempts.count >= this.maxAttempts) {
      return false;
    }

    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier);
    if (!attempts || attempts.count < this.maxAttempts) {
      return 0;
    }

    const remainingTime = this.windowMs - (Date.now() - attempts.lastAttempt);
    return Math.max(0, remainingTime);
  }
}