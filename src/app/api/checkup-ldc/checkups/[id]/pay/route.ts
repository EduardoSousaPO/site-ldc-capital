import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { Checkup } from '@/features/checkup-ldc/types';

// Cupons válidos para teste (permitem avançar sem pagamento)
const VALID_COUPONS = ['TESTE', 'FREE', 'DESCONTO100', 'DEV'];
// Códigos de acesso/senha válidos (permitem avançar sem pagamento)
const VALID_ACCESS_CODES = ['LDC2024', 'ACESSO2024', 'PREMIUM2024', 'TESTE123', 'SENHA123', 'CODE2024'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { nome, email, telefone, cupom, usar_cupom, codigo_acesso, usar_codigo } = body;
    
    const supabase = createSupabaseAdminClient();

    // Verificar se checkup existe e está em preview
    const { data: checkup, error: checkupError } = await supabase
      .from('Checkup')
      .select('status, analytics_json, score_total')
      .eq('id', id)
      .single();

    if (checkupError || !checkup) {
      return NextResponse.json({ error: 'Checkup not found' }, { status: 404 });
    }

    const checkupData = checkup as unknown as Checkup;
    if (checkupData.status !== 'preview') {
      return NextResponse.json(
        { error: 'Checkup already paid or invalid status' },
        { status: 400 }
      );
    }

    // Validar cupom se fornecido
    let cupomValido = false;
    if (usar_cupom && cupom) {
      const cupomUpper = cupom.toUpperCase().trim();
      cupomValido = VALID_COUPONS.includes(cupomUpper);
      
      if (!cupomValido) {
        return NextResponse.json(
          { error: 'Cupom inválido' },
          { status: 400 }
        );
      }
    }

    // Validar código de acesso se fornecido
    let codigoValido = false;
    if (usar_codigo && codigo_acesso) {
      const codigoUpper = codigo_acesso.toUpperCase().trim();
      codigoValido = VALID_ACCESS_CODES.includes(codigoUpper);
      
      if (!codigoValido) {
        return NextResponse.json(
          { error: 'Código de acesso inválido' },
          { status: 400 }
        );
      }
    }

    // Verificar se pelo menos um método de acesso foi validado
    const acessoLiberado = cupomValido || codigoValido;

    // TODO: Implementar salvamento de lead quando tabela Lead for criada
    // Por enquanto, apenas logamos os dados do lead
    if (nome && email) {
      console.log('Lead data (tabela Lead não existe):', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone?.trim() || null,
        checkupId: id,
        acessoLiberado,
        cupomValido,
        codigoValido,
      });
    }

    // Atualizar status do checkup para 'paid'
    // Em produção, aqui seria a integração com gateway de pagamento
    // Se cupom válido, também atualiza para 'paid' (acesso liberado)
    const { error: updateError } = await supabase
      .from('Checkup')
      .update({ status: 'paid' as const } as never)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating checkup:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: 'paid',
      usado_cupom: cupomValido,
      usado_codigo: codigoValido,
      acesso_liberado: acessoLiberado,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

