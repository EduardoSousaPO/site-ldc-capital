"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, Loader2, Save, Youtube } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampaignChips } from "../../_components/CampaignChips";
import { formatDateBR, formatDuration, formatNumber } from "../../_components/format";
import type { VideoPreview } from "../../_components/video-types";
import { extractVideoId } from "@/lib/youtube/extract-video-id";
import { isOfficialSlug, normalizeCampaignSlug } from "@/lib/youtube/normalize-campaign";
import { buildUtmUrl } from "@/lib/youtube/build-utm-url";

function NewVideoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = Boolean(editId);

  const [url, setUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastPreviewedId, setLastPreviewedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  const videoId = extractVideoId(url);
  const normalizedCampaign = normalizeCampaignSlug(campaign);
  const generatedUrl = videoId && normalizedCampaign
    ? buildUtmUrl({ videoId, campaign: normalizedCampaign, term })
    : "";
  const slugOffList = normalizedCampaign !== "" && !isOfficialSlug(normalizedCampaign);

  // Modo edição: carrega o vídeo existente.
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/videos/${editId}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Falha ao carregar");
        const v = json.data.video;
        setUrl(`https://youtu.be/${v.youtube_video_id}`);
        setCampaign(v.utm_campaign);
        setTerm(v.utm_term ?? "");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar vídeo");
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [editId]);

  const loadPreview = useCallback(async (id: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/preview?videoId=${id}`);
      const json = await res.json();
      if (res.ok && json.success) setPreview(json.data as VideoPreview);
      else setPreview(null);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Preview reativo ao videoId (durante digitação/paste), não no blur — evita
  // layout-shift no momento do clique nos chips. Event-driven, sem timer (§6.4).
  useEffect(() => {
    if (isEdit) return;
    if (videoId && videoId !== lastPreviewedId) {
      setLastPreviewedId(videoId);
      void loadPreview(videoId);
    } else if (!videoId && preview) {
      setPreview(null);
    }
  }, [videoId, isEdit, lastPreviewedId, loadPreview, preview]);

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      toast.success("Link UTM copiado!");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  };

  const handleSave = async (copyAfter: boolean) => {
    if (!isEdit && !videoId) {
      toast.error("Cole uma URL válida do YouTube.");
      return;
    }
    if (!normalizedCampaign) {
      toast.error("Informe a campanha.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/videos/${editId}` : "/api/admin/videos", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { utm_campaign: normalizedCampaign, utm_term: term || null }
            : { url, utm_campaign: normalizedCampaign, utm_term: term || null },
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Falha ao salvar");
      }
      if (json.data?.youtube_warning) {
        toast.warning("Vídeo salvo, mas métricas do YouTube indisponíveis no momento.");
      } else {
        toast.success(isEdit ? "Campanha atualizada!" : "Vídeo salvo!");
      }
      if (copyAfter && generatedUrl) {
        await navigator.clipboard.writeText(generatedUrl).catch(() => undefined);
      }
      const targetId = isEdit ? editId : json.data?.video?.id;
      router.push(targetId ? `/admin/videos/${targetId}` : "/admin/videos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#262d3d]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/videos" className="text-gray-500 hover:text-[#262d3d]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-[#262d3d]">
          {isEdit ? "Editar campanha do vídeo" : "Adicionar vídeo"}
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL do YouTube</Label>
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isEdit}
              aria-describedby="url-help"
            />
            <p id="url-help" className="text-xs text-gray-500">
              Aceita watch, youtu.be, shorts, embed e mobile.{" "}
              {videoId && <span className="text-[#98ab44]">videoId: {videoId}</span>}
            </p>
          </div>

          {/* Preview */}
          {(previewLoading || preview) && !isEdit && (
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              {previewLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : preview?.available ? (
                <>
                  {preview.thumbnail_url && (
                    <Image
                      src={preview.thumbnail_url}
                      alt={preview.title ?? "thumbnail"}
                      width={120}
                      height={68}
                      className="rounded object-cover"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#262d3d]">{preview.title}</p>
                    <p className="truncate text-xs text-gray-500">
                      {preview.channel_title} · {formatDateBR(preview.published_at)} ·{" "}
                      {formatDuration(preview.duration_seconds)} · {formatNumber(preview.view_count)} views
                    </p>
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Youtube className="h-4 w-4" /> Métricas do YouTube indisponíveis (o link ainda
                  funciona).
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="campaign">Campanha (utm_campaign)</Label>
            <Input
              id="campaign"
              placeholder="ex.: etfs-portfolio"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              onBlur={() => setCampaign(normalizeCampaignSlug(campaign))}
              aria-describedby="campaign-help"
            />
            <p id="campaign-help" className="text-xs text-gray-500">
              Normalizado para minúsculas-com-hífen.{" "}
              {normalizedCampaign && (
                <span className="text-[#98ab44]">slug: {normalizedCampaign}</span>
              )}
            </p>
            {slugOffList && (
              <p className="text-xs text-amber-600">
                Slug fora da lista oficial. OK se intencional.
              </p>
            )}
            <div className="pt-1">
              <CampaignChips onPick={(slug) => setCampaign(slug)} active={normalizedCampaign} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="term">Descrição / utm_term (opcional)</Label>
            <Input
              id="term"
              placeholder="ex.: abertura de mercado"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>

          {/* Link gerado */}
          <div className="space-y-1.5">
            <Label htmlFor="generated">Link UTM gerado</Label>
            <div className="flex gap-2">
              <Input
                id="generated"
                readOnly
                value={generatedUrl}
                placeholder="Preencha URL e campanha para gerar"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                disabled={!generatedUrl}
                aria-label="Copiar link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="bg-[#262d3d] hover:bg-[#344645]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEdit ? "Salvar" : "Salvar vídeo"}
            </Button>
            {!isEdit && (
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={saving || !generatedUrl}
              >
                <Copy className="mr-2 h-4 w-4" /> Salvar e copiar link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewVideoPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#262d3d]" />
          </div>
        }
      >
        <NewVideoForm />
      </Suspense>
    </AdminLayout>
  );
}
