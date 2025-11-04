/**
 * Componente para Google Analytics 4 e Google Tag Manager
 * Usa @next/third-parties para otimização
 */

"use client";

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { siteConfig } from "@/lib/seo-config";

export function Analytics() {
  // Só renderiza se os IDs estiverem configurados
  return (
    <>
      {siteConfig.googleAnalyticsId && (
        <GoogleAnalytics gaId={siteConfig.googleAnalyticsId} />
      )}
      {siteConfig.googleTagManagerId && (
        <GoogleTagManager gtmId={siteConfig.googleTagManagerId} />
      )}
    </>
  );
}

