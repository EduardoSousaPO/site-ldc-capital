import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import type { DiagnosisReport, Checkup } from '@/features/checkup-ldc/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Buscar checkup
    const { data: checkup, error: checkupError } = await supabase
      .from('Checkup')
      .select('*, report_json')
      .eq('id', id)
      .single();

    if (checkupError || !checkup) {
      return NextResponse.json({ error: 'Checkup not found' }, { status: 404 });
    }

    const checkupData = checkup as Checkup;
    const report = checkupData.report_json as DiagnosisReport | null;
    if (!report || !report.action_plan_7_days) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 400 });
    }

    // Gerar HTML do plano
    const planSteps = [
      'Defina um % alvo de exterior (ex.: 15%) e um limite de concentração (top5 ≤ 45%).',
      ...report.action_plan_7_days,
    ];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Plano de Ação - Checkup LDC</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #98ab44;">Plano de Ação - Checkup LDC</h2>
            <p>Olá,</p>
            <p>Segue o plano de ação personalizado para sua carteira:</p>
            <ol style="padding-left: 20px;">
              ${planSteps.map(step => `<li style="margin-bottom: 10px;">${step}</li>`).join('')}
            </ol>
            <p style="margin-top: 30px;">
              Este plano foi gerado com base na análise da sua carteira pelo Checkup-LDC.
            </p>
            <p>
              Para mais informações, acesse: <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ldccapital.com.br'}/checkup-ldc">Checkup-LDC</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Este é um e-mail automático. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `Plano de Ação - Checkup LDC\n\n${planSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nEste plano foi gerado com base na análise da sua carteira pelo Checkup-LDC.`;

    // Nota: Em produção, aqui você integraria com um serviço de e-mail real
    // Por exemplo: SendGrid, AWS SES, Resend, ou Supabase Edge Functions
    // Por enquanto, vamos apenas logar e retornar sucesso
    
    console.log('Enviando e-mail para:', email);
    console.log('Conteúdo:', textContent);

    // TODO: Integrar com serviço de e-mail real
    // Exemplo com Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@ldccapital.com.br',
    //   to: email,
    //   subject: 'Plano de Ação - Checkup LDC',
    //   html: htmlContent,
    //   text: textContent,
    // });

    return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar e-mail' },
      { status: 500 }
    );
  }
}

