"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "../../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "../../_components/KpiCard";
import { formatDateBR, formatNumber, formatPct, formatRelative } from "../../_components/format";
import type {
  LeadRowView,
  Pagination,
  VideoDetailResponse,
} from "../../_components/video-types";

const NAVY = "#262d3d";
const BEGE = "#98ab44";

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<VideoDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<LeadRowView[]>([]);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPagination, setLeadsPagination] = useState<Pagination | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Falha ao carregar");
      setDetail(json.data as VideoDetailResponse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar vídeo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/videos/${id}/leads?page=${leadsPage}&pageSize=50`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLeads(json.data.leads);
        setLeadsPagination(json.data.pagination);
      }
    } catch {
      /* tabela de leads é secundária — falha silenciosa */
    }
  }, [id, leadsPage]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/videos/${id}/refresh`, { method: "POST" });
      const json = await res.json();
      if (res.status === 429) {
        toast.warning("Aguarde 1 minuto entre atualizações.");
        return;
      }
      if (!res.ok || !json.success) throw new Error(json.message || "Falha ao atualizar");
      if (json.data.youtube_warning) {
        toast.warning("Métricas do YouTube indisponíveis no momento.");
      } else {
        toast.success("Métricas atualizadas!");
      }
      await fetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar métricas");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#262d3d]" />
        </div>
      </AdminLayout>
    );
  }

  if (!detail) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-gray-500">Vídeo não encontrado.</div>
      </AdminLayout>
    );
  }

  const { video, kpis, series } = detail;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/admin/videos" className="mt-1 text-gray-500 hover:text-[#262d3d]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              {video.thumbnail_url && (
                <Image
                  src={video.thumbnail_url}
                  alt=""
                  width={160}
                  height={90}
                  className="rounded object-cover"
                  unoptimized
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-[#262d3d]">
                  {video.title ?? video.youtube_video_id}
                </h1>
                <p className="text-sm text-gray-500">
                  {video.channel_title ?? "—"} · publicado {formatDateBR(video.published_at)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{video.utm_campaign}</Badge>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#98ab44] hover:underline"
                  >
                    Ver no YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/videos/new?id=${video.id}`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" /> Editar campanha
                </Button>
              </Link>
              <Button onClick={handleRefresh} disabled={refreshing} className="bg-[#262d3d] hover:bg-[#344645]">
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar métricas
              </Button>
            </div>
          </div>
        </div>

        {video.youtube_synced_at && (
          <p className="text-xs text-gray-400">
            Métricas sincronizadas {formatRelative(video.youtube_synced_at)}.
          </p>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Views" value={formatNumber(kpis.views)} icon={<Eye className="h-4 w-4" />}
            hint="Visualizações no YouTube (Data API). '—' se indisponível." />
          <KpiCard label="Leads" value={kpis.leads_total} icon={<Users className="h-4 w-4" />}
            hint="Total de leads atribuídos a este vídeo (Client.utm_content)." />
          <KpiCard label="Leads 7d" value={kpis.leads_7d} hint="Leads nos últimos 7 dias." />
          <KpiCard label="Leads 30d" value={kpis.leads_30d} hint="Leads nos últimos 30 dias." />
          <KpiCard label="Conversão" value={formatPct(kpis.conversion_rate)}
            hint="leads / views × 100%. '—' se views indisponíveis." />
          <KpiCard label="Última lead" value={kpis.last_lead_at ? formatRelative(kpis.last_lead_at) : "—"}
            hint="Quando o lead mais recente chegou." />
        </div>

        {/* Métricas YouTube secundárias */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" /> {formatNumber(kpis.likes)} likes
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" /> {formatNumber(kpis.comments)} comentários
          </span>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-medium text-[#262d3d]">Leads por dia (90 dias)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={series.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="count" name="Leads" stroke={BEGE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-medium text-[#262d3d]">Leads por origem</h2>
              {series.byOrigem.length === 0 ? (
                <p className="py-16 text-center text-sm text-gray-400">Sem leads ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={series.byOrigem}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="count" name="Leads" fill={NAVY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela de leads */}
        <Card>
          <CardContent className="p-0">
            <div className="border-b p-4">
              <h2 className="text-sm font-medium text-[#262d3d]">Leads deste vídeo</h2>
            </div>
            {leads.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                Nenhum lead atribuído a este vídeo ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Campanha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-gray-500">{formatDateBR(lead.createdAt)}</TableCell>
                      <TableCell className="font-medium text-[#262d3d]">{lead.name}</TableCell>
                      <TableCell className="text-gray-500">{lead.email ?? "—"}</TableCell>
                      <TableCell className="text-gray-500">{lead.phone ?? "—"}</TableCell>
                      <TableCell className="text-gray-500">{lead.patrimonio ?? "—"}</TableCell>
                      <TableCell>
                        {lead.utm_campaign ? <Badge variant="secondary">{lead.utm_campaign}</Badge> : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {leadsPagination && leadsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-3 text-sm text-gray-500">
                <span>
                  Página {leadsPagination.page} de {leadsPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={leadsPage <= 1} onClick={() => setLeadsPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={leadsPage >= leadsPagination.totalPages}
                    onClick={() => setLeadsPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
