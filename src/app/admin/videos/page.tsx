"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Search, Video as VideoIcon } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateBR, formatPct } from "../_components/format";
import type { Pagination, Period, VideoListItem } from "../_components/video-types";
import { OFFICIAL_CAMPAIGN_SLUGS } from "@/lib/youtube/normalize-campaign";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

export default function VideosListPage() {
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [campaign, setCampaign] = useState("");
  const [period, setPeriod] = useState<Period>("30d");
  const [sort, setSort] = useState<"leads_30d" | "created_at">("leads_30d");
  const [page, setPage] = useState(1);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, sort, page: String(page), pageSize: "20" });
      if (search) params.set("q", search);
      if (campaign) params.set("campaign", campaign);
      const res = await fetch(`/api/admin/videos?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Falha ao listar");
      setVideos(json.data.videos);
      setPagination(json.data.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar vídeos");
    } finally {
      setLoading(false);
    }
  }, [search, campaign, period, sort, page]);

  useEffect(() => {
    const t = setTimeout(fetchVideos, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchVideos, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#262d3d]">Vídeos rastreados</h1>
            <p className="text-sm text-gray-500">
              Gere links UTM e acompanhe leads por vídeo do YouTube.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/analytics/utm">
              <Button variant="outline">Dashboard UTM</Button>
            </Link>
            <Link href="/admin/videos/new">
              <Button className="bg-[#262d3d] hover:bg-[#344645]">
                <Plus className="mr-2 h-4 w-4" /> Adicionar vídeo
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-8"
                aria-label="Buscar vídeo"
              />
            </div>
            <select
              value={campaign}
              onChange={(e) => {
                setPage(1);
                setCampaign(e.target.value);
              }}
              aria-label="Filtrar por campanha"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">Todas campanhas</option>
              {OFFICIAL_CAMPAIGN_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              aria-label="Período"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "leads_30d" | "created_at")}
              aria-label="Ordenar"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="leads_30d">Mais leads (30d)</option>
              <option value="created_at">Mais recentes</option>
            </select>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[#262d3d]" />
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <VideoIcon className="h-10 w-10 text-gray-300" />
                <p className="text-gray-500">Nenhum vídeo rastreado ainda. Adicione o primeiro!</p>
                <Link href="/admin/videos/new">
                  <Button className="bg-[#262d3d] hover:bg-[#344645]">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar vídeo
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vídeo</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Adicionado</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">7d</TableHead>
                    <TableHead className="text-right">30d</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {v.thumbnail_url ? (
                            <Image
                              src={v.thumbnail_url}
                              alt=""
                              width={64}
                              height={36}
                              className="rounded object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-9 w-16 items-center justify-center rounded bg-gray-100">
                              <VideoIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="max-w-[260px] truncate font-medium text-[#262d3d]">
                            {v.title ?? v.youtube_video_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{v.utm_campaign}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{formatDateBR(v.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">{v.leads_total}</TableCell>
                      <TableCell className="text-right text-gray-500">{v.leads_7d}</TableCell>
                      <TableCell className="text-right text-gray-500">{v.leads_30d}</TableCell>
                      <TableCell className="text-right text-gray-500">
                        {formatPct(v.conversion_rate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/videos/${v.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver detalhe
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Página {pagination.page} de {pagination.totalPages} · {pagination.total} vídeos
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
