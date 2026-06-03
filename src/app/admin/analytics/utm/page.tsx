"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import type { AnalyticsUtm, Period } from "../../_components/video-types";

const NAVY = "#262d3d";
const BEGE = "#98ab44";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

export default function UtmDashboardPage() {
  const [data, setData] = useState<AnalyticsUtm | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/utm?period=${period}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Falha ao carregar");
      setData(json.data as AnalyticsUtm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/videos" className="text-gray-500 hover:text-[#262d3d]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-[#262d3d]">Dashboard UTM</h1>
              <p className="text-sm text-gray-500">Leads por campanha, origem e período.</p>
            </div>
          </div>
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#262d3d]" />
          </div>
        ) : !data ? (
          <p className="py-20 text-center text-gray-500">Sem dados.</p>
        ) : (
          <>
            {/* Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard label="Leads no período" value={data.summary.total}
                hint="Total de leads (Client) criados no período selecionado." />
              <KpiCard label="Com UTM" value={data.summary.withUtm}
                hint="Leads com utm_source preenchido (vieram de campanha rastreada)." />
              <KpiCard label="Share UTM" value={`${data.summary.sharePct}%`}
                hint="% de leads do período que vieram com utm_source." />
              <KpiCard
                label="Top campanha"
                value={data.summary.topCampaigns[0]?.key ?? "—"}
                hint="Campanha com mais leads no período."
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-3 text-sm font-medium text-[#262d3d]">Leads por campanha</h2>
                  {data.byCampaign.length === 0 ? (
                    <p className="py-16 text-center text-sm text-gray-400">Sem dados no período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.byCampaign} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="key" width={120} tick={{ fontSize: 10 }} />
                        <RTooltip />
                        <Bar dataKey="count" name="Leads" fill={BEGE} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-3 text-sm font-medium text-[#262d3d]">Leads por origem (utm_source)</h2>
                  {data.bySource.length === 0 ? (
                    <p className="py-16 text-center text-sm text-gray-400">Sem dados no período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.bySource}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <RTooltip />
                        <Bar dataKey="count" name="Leads" fill={NAVY} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Leads/dia */}
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-3 text-sm font-medium text-[#262d3d]">Leads por dia</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip />
                    <Line type="monotone" dataKey="count" name="Leads" stroke={BEGE} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top vídeos */}
            <Card>
              <CardContent className="p-0">
                <div className="border-b p-4">
                  <h2 className="text-sm font-medium text-[#262d3d]">Top 10 vídeos (leads no período)</h2>
                </div>
                {data.topVideos.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-400">Nenhum vídeo com leads no período.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vídeo</TableHead>
                        <TableHead>Campanha</TableHead>
                        <TableHead className="text-right">Leads (período)</TableHead>
                        <TableHead className="text-right">Leads 30d</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topVideos.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="max-w-[280px] truncate font-medium text-[#262d3d]">
                            {v.title ?? v.youtube_video_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{v.utm_campaign}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{v.leads_period}</TableCell>
                          <TableCell className="text-right text-gray-500">{v.leads_total_30d}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/videos/${v.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
