"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
  }
}

interface AnalyticsProps {
  gaId?: string;
  metaPixelId?: string;
}

export default function Analytics({ gaId, metaPixelId }: AnalyticsProps) {
  useEffect(() => {
    // Listener para eventos de consentimento
    const handleEnableAnalytics = () => {
      if (gaId && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    };

    const handleDisableAnalytics = () => {
      if (gaId && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
    };

    const handleEnableMarketing = () => {
      if (metaPixelId && window.fbq) {
        window.fbq("consent", "grant");
      }
    };

    const handleDisableMarketing = () => {
      if (metaPixelId && window.fbq) {
        window.fbq("consent", "revoke");
      }
    };

    window.addEventListener("enable-analytics", handleEnableAnalytics);
    window.addEventListener("disable-analytics", handleDisableAnalytics);
    window.addEventListener("enable-marketing", handleEnableMarketing);
    window.addEventListener("disable-marketing", handleDisableMarketing);

    // Verifica consentimento salvo
    const consent = localStorage.getItem("cookie-consent");
    if (consent) {
      const prefs = JSON.parse(consent);
      if (prefs.analytics) {
        handleEnableAnalytics();
      }
      if (prefs.marketing) {
        handleEnableMarketing();
      }
    }

    return () => {
      window.removeEventListener("enable-analytics", handleEnableAnalytics);
      window.removeEventListener("disable-analytics", handleDisableAnalytics);
      window.removeEventListener("enable-marketing", handleEnableMarketing);
      window.removeEventListener("disable-marketing", handleDisableMarketing);
    };
  }, [gaId, metaPixelId]);

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                
                // Configuração inicial com consentimento negado por padrão
                gtag('consent', 'default', {
                  'analytics_storage': 'denied',
                  'ad_storage': 'denied',
                  'wait_for_update': 500
                });
                
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `,
            }}
          />
        </>
      )}

      {/* Meta Pixel */}
      {metaPixelId && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('consent', 'revoke'); // Inicia com consentimento negado
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  );
}

