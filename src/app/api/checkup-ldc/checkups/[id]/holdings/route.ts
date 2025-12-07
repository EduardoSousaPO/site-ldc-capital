import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { RawHolding, HoldingType } from '@/features/checkup-ldc/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as Array<RawHolding & { tipo: HoldingType }>;
    
    const supabase = createSupabaseAdminClient();

    // Converter para formato do banco
    const holdings = body.map(h => ({
      checkup_id: id,
      nome_raw: h.nome_ou_codigo,
      ticker_norm: h.nome_ou_codigo.match(/^[A-Z]{4}\d{1,2}$/) ? h.nome_ou_codigo : null,
      tipo: h.tipo,
      valor: h.valor || 0,
      moeda: 'BRL',
    }));

    const { error } = await supabase
      .from('Holding')
      .insert(holdings);

    if (error) {
      console.error('Error saving holdings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: holdings.length });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

