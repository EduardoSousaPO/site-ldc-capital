import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { UserProfile } from '@/features/checkup-ldc/types';

export async function POST(request: Request) {
  try {
    const body = await request.json() as UserProfile;
    const supabase = createSupabaseAdminClient();

    // Buscar policy profile padrão
    const { data: profiles } = await supabase
      .from('PolicyProfile')
      .select('id')
      .eq('name', 'Padrão LDC')
      .limit(1)
      .single();

    // Criar checkup
    const { data: checkup, error } = await supabase
      .from('Checkup')
      .insert({
        objetivo_principal: body.objetivo_principal,
        prazo_anos: body.prazo_anos,
        tolerancia_risco: body.tolerancia_risco,
        idade_faixa: body.idade_faixa,
        policy_profile_id: profiles?.id || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating checkup:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(checkup);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

