import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { upsell_type, metadata } = await request.json();

    if (!upsell_type || !['guided_review', 'consultancy'].includes(upsell_type)) {
      return NextResponse.json({ error: 'Tipo de upsell inválido' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verificar se checkup existe
    const { data: checkup, error: checkupError } = await supabase
      .from('Checkup')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkupError || !checkup) {
      return NextResponse.json({ error: 'Checkup not found' }, { status: 404 });
    }

    // Registrar evento de upsell
    // Nota: Em produção, você pode criar uma tabela de eventos ou usar um serviço de analytics
    // Por enquanto, vamos apenas logar
    console.log('Upsell event:', {
      checkup_id: id,
      upsell_type,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // TODO: Criar tabela de eventos se necessário
    // Exemplo:
    // await supabase.from('CheckupEvent').insert({
    //   checkup_id: id,
    //   event_name: `upsell_${upsell_type}_clicked`,
    //   metadata: metadata,
    //   created_at: new Date().toISOString(),
    // });

    return NextResponse.json({
      success: true,
      message: 'Evento registrado com sucesso',
      upsell_type,
    });
  } catch (error) {
    console.error('Error tracking upsell:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar evento' },
      { status: 500 }
    );
  }
}

