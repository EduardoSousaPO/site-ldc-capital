"use client";

import { useState, useEffect, useCallback } from "react";

export interface DashboardPreferences {
  visibleSections: {
    financialSummary: boolean;
    parameters: boolean;
    projections: boolean;
    scenarios: boolean;
    protection: boolean;
  };
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  visibleSections: {
    financialSummary: false,
    parameters: false,
    projections: true,
    scenarios: true,
    protection: false,
  },
};

const STORAGE_KEY = "wealth-planning-dashboard-preferences";

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PREFERENCES;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    }

    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
    }
  }, [preferences]);

  const toggleSection = useCallback((section: keyof DashboardPreferences["visibleSections"]) => {
    setPreferences((prev) => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [section]: !prev.visibleSections[section],
      },
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    toggleSection,
    resetPreferences,
    setPreferences,
  };
}

