"use client";

import { useState, useCallback } from "react";

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface FieldValidation {
  isValid: boolean;
  message: string;
  touched: boolean;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  rules: Partial<Record<keyof T, ValidationRule<unknown>[]>>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, FieldValidation>>>(
    () => {
      const initial: Partial<Record<keyof T, FieldValidation>> = {};
      Object.keys(initialValues).forEach((key) => {
        initial[key as keyof T] = {
          isValid: true,
          message: "",
          touched: false,
        };
      });
      return initial;
    }
  );

  const validateField = useCallback(
    (field: keyof T, value: unknown): boolean => {
      const fieldRules = rules[field];
      if (!fieldRules || fieldRules.length === 0) {
        setErrors((prev) => ({
          ...prev,
          [field]: { isValid: true, message: "", touched: true },
        }));
        return true;
      }

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          setErrors((prev) => ({
            ...prev,
            [field]: { isValid: false, message: rule.message, touched: true },
          }));
          return false;
        }
      }

      setErrors((prev) => ({
        ...prev,
        [field]: { isValid: true, message: "", touched: true },
      }));
      return true;
    },
    [rules]
  );

  const validateAll = useCallback((): boolean => {
    let allValid = true;
    const newErrors: Partial<Record<keyof T, FieldValidation>> = {};

    Object.keys(initialValues).forEach((key) => {
      const field = key as keyof T;
      const value = initialValues[field];
      const fieldRules = rules[field];

      if (fieldRules && fieldRules.length > 0) {
        let isValid = true;
        let message = "";

        for (const rule of fieldRules) {
          if (!rule.validate(value)) {
            isValid = false;
            message = rule.message;
            allValid = false;
            break;
          }
        }

        newErrors[field] = { isValid, message, touched: true };
      } else {
        newErrors[field] = { isValid: true, message: "", touched: true };
      }
    });

    setErrors(newErrors);
    return allValid;
  }, [initialValues, rules]);

  const clearField = useCallback((field: keyof T) => {
    setErrors((prev) => ({
      ...prev,
      [field]: { isValid: true, message: "", touched: false },
    }));
  }, []);

  const clearAll = useCallback(() => {
    const cleared: Partial<Record<keyof T, FieldValidation>> = {};
    Object.keys(initialValues).forEach((key) => {
      cleared[key as keyof T] = { isValid: true, message: "", touched: false };
    });
    setErrors(cleared);
  }, [initialValues]);

  const getFieldError = useCallback(
    (field: keyof T): string => {
      return errors[field]?.message || "";
    },
    [errors]
  );

  const isFieldValid = useCallback(
    (field: keyof T): boolean => {
      return errors[field]?.isValid !== false;
    },
    [errors]
  );

  const isFieldTouched = useCallback(
    (field: keyof T): boolean => {
      return errors[field]?.touched || false;
    },
    [errors]
  );

  return {
    errors,
    validateField,
    validateAll,
    clearField,
    clearAll,
    getFieldError,
    isFieldValid,
    isFieldTouched,
  };
}
