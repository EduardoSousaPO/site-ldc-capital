import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { Checkup } from '@/features/checkup-ldc/types';
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

    const checkupData = checkup as Checkup;

    // Relatório completo só pode ser gerado após pagamento
    if (checkupData.status !== 'paid' && checkupData.status !== 'done') {
      return NextResponse.json(
        { error: 'Checkup must be paid to generate full report' },
        { status: 403 }
      );
    }

    const analytics = checkupData.analytics_json;

    // Buscar policy profile
    let policyProfile: PolicyProfile | null = null;
    if (checkupData.policy_profile_id) {
      const { data: profile } = await supabase
        .from('PolicyProfile')
        .select('*')
        .eq('id', checkupData.policy_profile_id)
        .single();
      if (profile) {
        policyProfile = profile as PolicyProfile;
      }
    }

    // Se não tiver, buscar padrão
    if (!policyProfile) {
      const { data: defaultProfile } = await supabase
        .from('PolicyProfile')
        .select('*')
        .eq('name', 'Padrão LDC')
        .single();
      if (defaultProfile) {
        policyProfile = defaultProfile as PolicyProfile;
      }
    }

    if (!policyProfile) {
      return NextResponse.json({ error: 'Policy profile not found' }, { status: 500 });
    }

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not found' }, { status: 400 });
    }

    // Preparar user profile
    const userProfile = {
      objetivo_principal: checkupData.objetivo_principal,
      prazo_anos: checkupData.prazo_anos,
      tolerancia_risco: checkupData.tolerancia_risco,
      idade_faixa: checkupData.idade_faixa,
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
        report_json: diagnosis as unknown,
        // Manter status atual se for 'paid', caso contrário mudar para 'done'
        status: checkupData.status === 'paid' ? 'paid' : 'done',
      } as never)
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

