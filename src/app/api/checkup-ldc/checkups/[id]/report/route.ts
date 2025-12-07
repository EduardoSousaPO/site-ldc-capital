import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { LLMOrchestrator } from '@/features/checkup-ldc/llm/orchestrator';
import { getDiagnosisPrompt, PROMPT_VERSION } from '@/features/checkup-ldc/llm/prompts';
import type { PolicyProfile } from '@/features/checkup-ldc/types';

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

    // Relatório completo só pode ser gerado após pagamento
    if (checkup.status !== 'paid' && checkup.status !== 'done') {
      return NextResponse.json(
        { error: 'Checkup must be paid to generate full report' },
        { status: 403 }
      );
    }

    const analytics = checkup.analytics_json;

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

    // Se não tiver, buscar padrão
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

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not found' }, { status: 400 });
    }

    // Preparar user profile
    const userProfile = {
      objetivo_principal: checkup.objetivo_principal,
      prazo_anos: checkup.prazo_anos,
      tolerancia_risco: checkup.tolerancia_risco,
      idade_faixa: checkup.idade_faixa,
    };

    // Gerar diagnóstico via LLM
    const orchestrator = new LLMOrchestrator();
    const prompt = getDiagnosisPrompt(policyProfile);

    const diagnosis = await orchestrator.generateDiagnosis(
      id,
      analytics,
      userProfile,
      policyProfile,
      prompt,
      PROMPT_VERSION
    );

    // Atualizar checkup com relatório, mantendo status 'paid' (ou 'done' se já estava)
    const { error: updateError } = await supabase
      .from('Checkup')
      .update({
        report_json: diagnosis,
        // Manter status atual se for 'paid', caso contrário mudar para 'done'
        status: checkup.status === 'paid' ? 'paid' : 'done',
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating checkup:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ diagnosis });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

