"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    __ldcMetaPixelBootstrapped?: boolean;
  }
}

interface AnalyticsProps {
  gaId?: string;
  metaPixelId?: string;
  gtmId?: string;
}

export default function Analytics({ gaId, metaPixelId, gtmId }: AnalyticsProps) {
  // Meta Pixel: uma única inicialização por aba. next/script + hidratação/Strict Mode
  // podem disparar o snippet duas vezes e dobrar PageView / métricas na Meta.
  useEffect(() => {
    if (!metaPixelId || typeof window === "undefined") return;
    if (window.__ldcMetaPixelBootstrapped) return;
    window.__ldcMetaPixelBootstrapped = true;
    if (window.fbq) return;

    const s = document.createElement("script");
    s.text = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('consent', 'grant');
fbq('track', 'PageView');
`;
    document.head.appendChild(s);
  }, [metaPixelId]);

  return (
    <>
      {/* Google Tag Manager — habilita centralização de eventos (GA4, Ads, etc.).
          Inicializa dataLayer antes de qualquer push externo. */}
      {gtmId && (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

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
                
                // Configuração com consentimento concedido
                gtag('consent', 'default', {
                  'analytics_storage': 'granted',
                  'ad_storage': 'granted'
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

    </>
  );
}

