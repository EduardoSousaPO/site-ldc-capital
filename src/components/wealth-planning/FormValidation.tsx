"use client";

import { AlertCircle, CheckCircle } from "lucide-react";

interface ValidationMessageProps {
  type: "error" | "success" | "warning" | "info";
  message: string;
  show?: boolean;
}

export function ValidationMessage({ type, message, show = true }: ValidationMessageProps) {
  if (!show || !message) return null;

  const styles = {
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    error: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-sans ${styles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}

interface FieldValidationProps {
  value: unknown;
  rules: Array<{
    validate: (value: unknown) => boolean;
    message: string;
  }>;
  show?: boolean;
}

export function FieldValidation({ value, rules, show = true }: FieldValidationProps) {
  if (!show) return null;

  for (const rule of rules) {
    if (!rule.validate(value)) {
      return <ValidationMessage type="error" message={rule.message} />;
    }
  }

  return null;
}

// Validações comuns
export const validators = {
  required: (message = "Este campo é obrigatório") => ({
    validate: (value: unknown) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return !isNaN(value) && value > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  min: (min: number, message?: string) => ({
    validate: (value: number) => !isNaN(value) && value >= min,
    message: message || `O valor deve ser maior ou igual a ${min}`,
  }),

  max: (max: number, message?: string) => ({
    validate: (value: number) => !isNaN(value) && value <= max,
    message: message || `O valor deve ser menor ou igual a ${max}`,
  }),

  range: (min: number, max: number, message?: string) => ({
    validate: (value: number) => !isNaN(value) && value >= min && value <= max,
    message: message || `O valor deve estar entre ${min} e ${max}`,
  }),

  age: (message = "Idade deve estar entre 18 e 120 anos") => ({
    validate: (value: number) => !isNaN(value) && value >= 18 && value <= 120,
    message,
  }),

  positive: (message = "O valor deve ser positivo") => ({
    validate: (value: number) => !isNaN(value) && value >= 0,
    message,
  }),

  percentage: (message = "O valor deve estar entre 0% e 100%") => ({
    validate: (value: number) => !isNaN(value) && value >= 0 && value <= 100,
    message,
  }),
};

