"use client";

import { OFFICIAL_CAMPAIGN_SLUGS } from "@/lib/youtube/normalize-campaign";

interface CampaignChipsProps {
  onPick: (slug: string) => void;
  active?: string;
}

/** Chips clicáveis com os 6 slugs oficiais (sugestão visual, não bloqueia outros). */
export function CampaignChips({ onPick, active }: CampaignChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Campanhas oficiais sugeridas">
      {OFFICIAL_CAMPAIGN_SLUGS.map((slug) => {
        const isActive = active === slug;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onPick(slug)}
            aria-pressed={isActive}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#98ab44] ${
              isActive
                ? "border-[#98ab44] bg-[#98ab44]/15 text-[#262d3d]"
                : "border-gray-300 bg-white text-gray-600 hover:border-[#98ab44] hover:text-[#262d3d]"
            }`}
          >
            {slug}
          </button>
        );
      })}
    </div>
  );
}
