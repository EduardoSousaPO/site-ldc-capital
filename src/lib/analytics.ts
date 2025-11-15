// Funções auxiliares para tracking de eventos

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

/**
 * Tracka um evento no Google Analytics
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Tracka uma conversão no Google Analytics
 */
export function trackConversion(value?: number, currency = "BRL") {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: "AW-CONVERSION_ID/CONVERSION_LABEL", // Substitua pelos seus IDs
      value: value,
      currency: currency,
    });
  }
}

/**
 * Tracka um evento no Meta Pixel
 */
export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

/**
 * Tracka um lead (formulário preenchido)
 */
export function trackLead(source: string, value?: number) {
  trackEvent("lead", "engagement", source, value);
  trackMetaEvent("Lead", {
    content_name: source,
    value: value,
    currency: "BRL",
  });
}

/**
 * Tracka visualização de página
 */
export function trackPageView(path: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID || "", {
      page_path: path,
    });
  }
}

/**
 * Tracka download de material
 */
export function trackDownload(materialName: string, materialType: string) {
  trackEvent("download", "engagement", `${materialType}: ${materialName}`);
  trackMetaEvent("ViewContent", {
    content_name: materialName,
    content_category: materialType,
  });
}

/**
 * Tracka visualização de post do blog
 */
export function trackBlogView(postTitle: string, category: string) {
  trackEvent("view", "blog", postTitle);
  trackMetaEvent("ViewContent", {
    content_name: postTitle,
    content_category: category,
    content_type: "article",
  });
}

