/**
 * Cron de backfill do guia /guia.
 *
 * Roda 1x por hora via Vercel Cron. Para cada lead em guia_leads que:
 *   - foi criado há mais de 1h
 *   - foi criado nos últimos 30 dias
 *   - ainda não tem guia_sent_at preenchido
 *
 * → chama a edge function send-ebook-email com material=GUIA.
 *
 * Cobre o cenário em que o lead preencheu o form mas não chegou a
 * mandar mensagem no WhatsApp (e portanto o agente IA não disparou
 * o envio). O cron resolve esses leads "órfãos" automaticamente.
 *
 * Segurança: CRON_SECRET (timing-safe equal) — Vercel envia
 * `Authorization: Bearer ${CRON_SECRET}` automaticamente.
 *
 * Idempotência: após cada envio bem-sucedido, guia_sent_at é
 * preenchido. O lead nunca recebe duas vezes pelo cron.
 */

import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EDGE_URL =
  'https://wsoxukpeyzmpcngjugie.supabase.co/functions/v1/send-ebook-email';
const BATCH_LIMIT = 50;
const RATE_DELAY_MS = 500;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
}

type LeadRow = {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  patrimonio_range: string;
  created_at: string;
};

async function processLead(
  supabase: ReturnType<typeof getAdminClient>,
  lead: LeadRow,
  webhookSecret: string
): Promise<{ id: string; status: 'sent' | 'failed'; messageId?: string; error?: string }> {
  const url = `${EDGE_URL}?secret=${encodeURIComponent(webhookSecret)}`;
  const body = {
    phone: normalizePhone(lead.whatsapp),
    email: lead.email,
    name: lead.nome,
    material: 'GUIA',
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await r.json().catch(() => ({}))) as {
      success?: boolean;
      message_id?: string;
      error?: string;
    };

    if (!r.ok || !data.success) {
      return { id: lead.id, status: 'failed', error: data.error || `http ${r.status}` };
    }

    await supabase
      .from('guia_leads')
      .update({
        guia_sent_at: new Date().toISOString(),
        guia_message_id: data.message_id || null,
      })
      .eq('id', lead.id);

    return { id: lead.id, status: 'sent', messageId: data.message_id };
  } catch (e) {
    return { id: lead.id, status: 'failed', error: e instanceof Error ? e.message : String(e) };
  }
}

async function handler(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!constantTimeEqual(token, cronSecret)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const webhookSecret = process.env.GUIA_BACKFILL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'GUIA_BACKFILL_WEBHOOK_SECRET nao configurada' },
      { status: 500 }
    );
  }

  const supabase = getAdminClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from('guia_leads')
    .select('id, nome, whatsapp, email, patrimonio_range, created_at')
    .is('guia_sent_at', null)
    .lt('created_at', oneHourAgo)
    .gt('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error('[guia-backfill] erro na query:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ processed: 0, results: [] });
  }

  const results: Awaited<ReturnType<typeof processLead>>[] = [];
  for (const lead of leads as LeadRow[]) {
    const r = await processLead(supabase, lead, webhookSecret);
    results.push(r);
    await new Promise((res) => setTimeout(res, RATE_DELAY_MS));
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  const failed = results.length - sent;
  console.log(`[guia-backfill] processed=${results.length} sent=${sent} failed=${failed}`);

  return NextResponse.json({ processed: results.length, sent, failed, results });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
