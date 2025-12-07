import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { calculateAnalytics } from '@/features/checkup-ldc/analytics/engine';
import { calculateScore } from '@/features/checkup-ldc/analytics/score';
import type { UserProfile, PolicyProfile } from '@/features/checkup-ldc/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    // Buscar checkup
    const { data: checkup, error: checkupError } = await supabase
      .from('Checkup')
      .select('*')
      .eq('id', id)
      .single();

    if (checkupError || !checkup) {
      return NextResponse.json({ error: 'Checkup not found' }, { status: 404 });
    }

    // Buscar policy profile
    let policyProfile: PolicyProfile | null = null;
    if (checkup.policy_profile_id) {
      const { data: profile } = await supabase
        .from('PolicyProfile')
        .select('*')
        .eq('id', checkup.policy_profile_id)
        .single();
      policyProfile = profile as PolicyProfile;
    }

    // Se não tiver policy profile, buscar padrão
    if (!policyProfile) {
      const { data: defaultProfile } = await supabase
        .from('PolicyProfile')
        .select('*')
        .eq('name', 'Padrão LDC')
        .single();
      policyProfile = defaultProfile as PolicyProfile;
    }

    if (!policyProfile) {
      return NextResponse.json({ error: 'Policy profile not found' }, { status: 500 });
    }

    // Buscar holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('Holding')
      .select('*')
      .eq('checkup_id', id);

    if (holdingsError || !holdings || holdings.length === 0) {
      return NextResponse.json({ error: 'No holdings found' }, { status: 400 });
    }

    // Preparar dados
    const userProfile: UserProfile = {
      objetivo_principal: checkup.objetivo_principal as UserProfile['objetivo_principal'],
      prazo_anos: checkup.prazo_anos || 10,
      tolerancia_risco: checkup.tolerancia_risco as UserProfile['tolerancia_risco'],
      idade_faixa: checkup.idade_faixa,
    };

    // Calcular analytics
    const analytics = calculateAnalytics(holdings, userProfile, policyProfile);
    const score = calculateScore(analytics, policyProfile);

    // Atualizar checkup
    const { error: updateError } = await supabase
      .from('Checkup')
      .update({
        analytics_json: analytics,
        score_total: score,
        status: 'preview',
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating checkup:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ analytics, score });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

