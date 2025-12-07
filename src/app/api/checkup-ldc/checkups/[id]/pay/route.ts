import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

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

    if (checkup.status !== 'preview') {
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

    // Salvar lead na tabela Lead (se dados fornecidos)
    if (nome && email) {
      try {
        const analytics = checkup.analytics_json as any;
        // Estimar patrimônio baseado na análise (se disponível)
        const patrimonioEstimado = analytics?.concentration_top5 
          ? '1m-5m' // Estimativa baseada na análise
          : '0-300k';

        const scoreTotal = checkup.score_total || null;
        
        const { error: leadError } = await supabase
          .from('Lead')
          .insert({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            telefone: telefone?.trim() || null,
            patrimonio: patrimonioEstimado,
            origem: 'checkup-ldc',
            origemFormulario: 'Checkup-LDC',
            status: acessoLiberado ? 'Qualificado (Código)' : 'Qualificado',
            observacoes: acessoLiberado 
              ? `Checkup ID: ${id}. Acesso via ${cupomValido ? `cupom: ${cupom}` : `código: ${codigo_acesso}`}. Score: ${scoreTotal || 'N/A'}`
              : `Checkup ID: ${id}. Score: ${scoreTotal || 'N/A'}`,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: request.headers.get('user-agent') || null,
          });

        if (leadError) {
          console.error('Error saving lead:', leadError);
          // Não falhar o pagamento se houver erro ao salvar lead
        }
      } catch (error) {
        console.error('Error processing lead:', error);
        // Não falhar o pagamento se houver erro ao salvar lead
      }
    }

    // Atualizar status do checkup para 'paid'
    // Em produção, aqui seria a integração com gateway de pagamento
    // Se cupom válido, também atualiza para 'paid' (acesso liberado)
    const { error: updateError } = await supabase
      .from('Checkup')
      .update({ status: 'paid' })
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

