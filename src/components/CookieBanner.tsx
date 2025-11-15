"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Cookie, X, Settings } from "lucide-react";
import Link from "next/link";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Sempre true, não pode ser desabilitado
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verifica se o usuário já deu consentimento
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Aguarda um pouco antes de mostrar o banner
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Carrega preferências salvas
      const savedPrefs = JSON.parse(consent);
      setPreferences(savedPrefs);
      applyCookies(savedPrefs);
    }
  }, []);

  const applyCookies = (prefs: CookiePreferences) => {
    // Salva preferências no localStorage
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());

    // Dispara eventos customizados para os scripts de analytics
    if (prefs.analytics) {
      window.dispatchEvent(new CustomEvent("enable-analytics"));
    } else {
      window.dispatchEvent(new CustomEvent("disable-analytics"));
    }

    if (prefs.marketing) {
      window.dispatchEvent(new CustomEvent("enable-marketing"));
    } else {
      window.dispatchEvent(new CustomEvent("disable-marketing"));
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    applyCookies(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    applyCookies(onlyNecessary);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    applyCookies(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-2xl border-2">
        <CardContent className="p-6">
          {!showSettings ? (
            <>
              <div className="flex items-start gap-4 mb-4">
                <Cookie className="w-6 h-6 text-[#98ab44] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-2">
                    Utilizamos cookies
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência,
                    analisar o desempenho do site e personalizar conteúdo e anúncios. Ao continuar
                    navegando, você concorda com nossa{" "}
                    <Link
                      href="/politica-privacidade"
                      className="text-[#98ab44] hover:underline font-medium"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBanner(false)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1"
                >
                  Rejeitar Todos
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Personalizar
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-[#98ab44] hover:bg-[#7a8d35] text-white"
                >
                  Aceitar Todos
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl font-bold text-[#262d3d]">
                  Configurações de Cookies
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={preferences.necessary}
                    disabled
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label className="font-semibold text-sm text-[#262d3d]">
                      Cookies Necessários
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Essenciais para o funcionamento do site. Não podem ser desativados.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, analytics: checked === true })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label className="font-semibold text-sm text-[#262d3d]">
                      Cookies de Análise
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Nos ajudam a entender como os visitantes interagem com o site (Google
                      Analytics).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketing: checked === true })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label className="font-semibold text-sm text-[#262d3d]">
                      Cookies de Marketing
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Usados para personalizar anúncios e medir a eficácia de campanhas (Meta
                      Pixel).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1"
                >
                  Rejeitar Todos
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-[#98ab44] hover:bg-[#7a8d35] text-white"
                >
                  Salvar Preferências
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

