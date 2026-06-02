import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Verifica qual serviço de email usar
const useResend = !!process.env.RESEND_API_KEY;
const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;

/** Email onde as mensagens do formulário de contato devem chegar (obrigatório) */
export const CONTATO_EMAIL = process.env.CONTATO_EMAIL || 'contato@ldccapital.com.br';

/** Remetente Resend: RESEND_FROM_EMAIL ou "EBOOK_FROM_NAME <EBOOK_FROM_EMAIL>" (compatível com o outro projeto) */
function getResendFrom(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  const email = process.env.EBOOK_FROM_EMAIL;
  const name = process.env.EBOOK_FROM_NAME || 'LDC Capital';
  if (email) return `${name} <${email}>`;
  return 'LDC Capital <onboarding@resend.dev>';
}

// Configuração do transporter de email (Gmail/SMTP)
export function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

type EmailAttachment = {
  filename: string;
  content: Buffer;
};

// Função genérica para enviar email (usa Resend ou SMTP)
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: EmailAttachment[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fromEmail = options.from || `LDC Capital <${process.env.SMTP_USER || CONTATO_EMAIL}>`;

  // Se Resend estiver configurado, usar Resend
  if (useResend && resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: getResendFrom(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      if (error) {
        console.error('Erro Resend:', error);
        return { success: false, error: error.message };
      }

      console.log('Email enviado via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Erro ao enviar via Resend:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Se SMTP estiver configurado, usar nodemailer
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = createEmailTransporter();
      const result = await transporter.sendMail({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      console.log('Email enviado via SMTP:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Erro ao enviar via SMTP:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
  
  // Nenhum serviço de email configurado
  console.warn('Nenhum serviço de email configurado (RESEND_API_KEY ou SMTP_USER/SMTP_PASS)');
  return { success: false, error: 'Serviço de email não configurado' };
}

// Função para enviar email de novo lead/contato para a equipe
export async function sendNewLeadEmail(data: {
  nome: string;
  email: string;
  telefone: string;
  patrimonio: string;
  origem: string;
  mensagem?: string;
  titulo?: string;
  origemFormulario:
    | 'Home'
    | 'Fale Conosco'
    | 'Materiais'
    | 'Page - ebook invest internacionais'
    | 'Calculadora IR Dividendos 2026';
}) {
  // Template do email para a equipe
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #98ab44, #becc6a); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Novo ${data.origemFormulario === 'Fale Conosco' ? 'Contato' : 'Lead'} - LDC Capital</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Formulário: ${data.origemFormulario}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #262d3d; margin-top: 0;">Informações do ${data.origemFormulario === 'Fale Conosco' ? 'Contato' : 'Lead'}</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Nome:</strong> ${data.nome}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Email:</strong> 
          <a href="mailto:${data.email}" style="color: #262d3d;">${data.email}</a>
        </div>
        
        ${data.telefone ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Telefone:</strong> 
          <a href="tel:${data.telefone}" style="color: #262d3d;">${data.telefone}</a>
        </div>
        ` : ''}
        
        ${data.patrimonio && data.patrimonio !== 'Não informado' ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Patrimônio para Investimento:</strong> ${data.patrimonio}
        </div>
        ` : ''}
        
        ${data.origem && data.origem !== 'Formulário de Contato' ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Como nos conheceu:</strong> ${data.origem}
        </div>
        ` : ''}
        
        ${data.titulo ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Assunto:</strong> ${data.titulo}
        </div>
        ` : ''}
        
        ${data.mensagem ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #98ab44;">Mensagem:</strong>
          <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 5px; border-left: 4px solid #98ab44;">
            ${data.mensagem.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; padding: 20px; background: #262d3d; border-radius: 10px; color: white;">
        <p style="margin: 0; font-size: 14px;">
          Este ${data.origemFormulario === 'Fale Conosco' ? 'contato' : 'lead'} foi capturado automaticamente pelo site da LDC Capital
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
          Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </p>
      </div>
    </div>
  `;

  const subject = data.origemFormulario === 'Fale Conosco' 
    ? `📩 Nova Mensagem - ${data.nome} | ${data.titulo || 'Contato pelo Site'}`
    : `🎯 Novo Lead - ${data.nome} (${data.origemFormulario})`;

  return sendEmail({
    to: CONTATO_EMAIL,
    subject,
    html: htmlContent,
  });
}

// Função para enviar o guia ao lead via /guia
export async function sendGuiaEmail(nome: string, email: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ldccapital.com.br';

  // Tenta carregar o PDF estático gerado por `npm run pdf:build`.
  // Se não existir (ambiente novo ou deploy sem build do PDF), o email vai como link-only.
  let attachments: { filename: string; content: Buffer }[] | undefined;
  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const pdfPath = path.join(process.cwd(), 'public', 'guia-ldc-capital.pdf');
    const buf = await readFile(pdfPath);
    attachments = [{ filename: 'LDC-Capital-Guia.pdf', content: buf }];
  } catch {
    console.warn('[sendGuiaEmail] PDF estático ausente em public/guia-ldc-capital.pdf — enviando email link-only.');
  }

  const htmlContent = `
    <div style="font-family:'Public Sans',sans-serif;max-width:560px;margin:0 auto;color:#1a1f2e;">
      <div style="background:#262d3d;padding:32px 40px;">
        <p style="color:#ffffff;font-size:18px;font-weight:600;margin:0;">LDC Capital</p>
      </div>
      <div style="padding:40px;background:#f8f8f6;">
        <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;">Olá, ${nome}.</h1>
        <p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:#3d4455;">
          Seu guia está ${attachments ? 'em anexo neste email' : 'pronto para download'}.
          ${attachments ? 'Caso queira ler direto no navegador, use o botão abaixo.' : 'Clique no botão abaixo para acessar.'}
        </p>
        <a href="${siteUrl}/guia-pdf"
           style="display:inline-block;background:#98ab44;color:#1a1f2e;
                  font-weight:700;font-size:14px;padding:14px 28px;
                  text-decoration:none;border-radius:4px;">
          ${attachments ? 'Abrir no navegador' : 'Acessar meu guia'}
        </a>
        <p style="font-size:12px;color:#577171;margin-top:32px;line-height:1.6;">
          Luciano Herzog · CEO LDC Capital · CVM 3976-4<br />
          ldccapital.com.br
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Seu guia — O que os bankers de São Paulo não te contam | LDC Capital',
    html: htmlContent,
    attachments,
  });
}

// Função para enviar email de confirmação para o lead/visitante
export async function sendConfirmationEmail(data: {
  nome: string;
  email: string;
  origemFormulario:
    | 'Home'
    | 'Fale Conosco'
    | 'Materiais'
    | 'Page - ebook invest internacionais'
    | 'Calculadora IR Dividendos 2026';
}) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #98ab44, #becc6a); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Obrigado pelo seu contato!</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">LDC Capital - Mais do que finanças, direção</p>
      </div>
      
      <div style="padding: 25px;">
        <h2 style="color: #262d3d; margin-top: 0;">Olá, ${data.nome}!</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Recebemos ${data.origemFormulario === 'Fale Conosco' ? 'sua mensagem' : 'seu contato'} através do nosso site e agradecemos pelo interesse em nossos serviços.
        </p>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Nossa equipe analisará suas informações e entrará em contato em breve para ${data.origemFormulario === 'Fale Conosco' ? 'responder sua mensagem' : 'agendar uma conversa personalizada sobre seus objetivos financeiros'}.
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #98ab44;">
          <h3 style="color: #98ab44; margin-top: 0;">Próximos Passos:</h3>
          <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Nossa equipe entrará em contato em até 24 horas úteis</li>
            ${data.origemFormulario !== 'Fale Conosco' ? '<li>Agendaremos uma conversa para entender melhor seus objetivos</li>' : ''}
            ${data.origemFormulario !== 'Fale Conosco' ? '<li>Apresentaremos uma proposta personalizada para seu perfil</li>' : ''}
          </ul>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          Enquanto isso, fique à vontade para conhecer mais sobre nossos serviços em nosso site ou entrar em contato conosco:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ldccapital.com.br" style="background: #98ab44; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Visitar Site
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #262d3d; border-radius: 10px; color: white;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">LDC Capital</p>
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">
          📧 ${CONTATO_EMAIL} | 📱 (51) 99820-0000
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
          Raízes no Interior. Olhos no Horizonte.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: data.email,
    subject: data.origemFormulario === 'Fale Conosco' 
      ? 'Recebemos sua mensagem - LDC Capital'
      : 'Obrigado pelo seu contato - LDC Capital',
    html: htmlContent,
  });
}

