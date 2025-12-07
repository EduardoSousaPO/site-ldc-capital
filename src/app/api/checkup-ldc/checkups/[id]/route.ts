import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { PolicyProfile } from '@/features/checkup-ldc/types';

export async function GET(
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

    // Buscar policy profile se existir
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

    return NextResponse.json({
      id: checkup.id,
      status: checkup.status,
      policy_profile: policyProfile,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

