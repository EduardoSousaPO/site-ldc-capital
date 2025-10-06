import nodemailer from 'nodemailer';

// Configuração do transporter de email
export function createEmailTransporter() {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Função para enviar email de novo lead
export async function sendNewLeadEmail(data: {
  nome: string;
  email: string;
  telefone: string;
  patrimonio: string;
  origem: string;
  mensagem?: string;
  titulo?: string;
  origemFormulario: 'Home' | 'Fale Conosco' | 'Materiais';
}) {
  try {
    const transporter = createEmailTransporter();

    // Template do email para a equipe
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #98ab44, #becc6a); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Novo Lead - LDC Capital</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Formulário: ${data.origemFormulario}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #262d3d; margin-top: 0;">Informações do Lead</h2>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Nome:</strong> ${data.nome}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Email:</strong> 
            <a href="mailto:${data.email}" style="color: #262d3d;">${data.email}</a>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Telefone:</strong> 
            <a href="tel:${data.telefone}" style="color: #262d3d;">${data.telefone}</a>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Patrimônio para Investimento:</strong> ${data.patrimonio}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Como nos conheceu:</strong> ${data.origem}
          </div>
          
          ${data.titulo ? `
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Título:</strong> ${data.titulo}
          </div>
          ` : ''}
          
          ${data.mensagem ? `
          <div style="margin-bottom: 15px;">
            <strong style="color: #98ab44;">Mensagem:</strong>
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 5px; border-left: 4px solid #98ab44;">
              ${data.mensagem}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; padding: 20px; background: #262d3d; border-radius: 10px; color: white;">
          <p style="margin: 0; font-size: 14px;">
            Este lead foi capturado automaticamente pelo site da LDC Capital
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
            Data: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `;

    // Enviar email para a equipe
    const mailOptions = {
      from: `"LDC Capital - Site" <${process.env.SMTP_USER}>`,
      to: 'contato@ldccapital.com.br',
      subject: `Novo Lead - ${data.nome} (${data.origemFormulario})`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Função para enviar email de confirmação para o lead
export async function sendConfirmationEmail(data: {
  nome: string;
  email: string;
  origemFormulario: 'Home' | 'Fale Conosco' | 'Materiais';
}) {
  try {
    const transporter = createEmailTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #98ab44, #becc6a); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Obrigado pelo seu contato!</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">LDC Capital - Mais do que finanças, direção</p>
        </div>
        
        <div style="padding: 25px;">
          <h2 style="color: #262d3d; margin-top: 0;">Olá, ${data.nome}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Recebemos seu contato através do nosso site e agradecemos pelo interesse em nossos serviços.
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Nossa equipe analisará suas informações e entrará em contato em breve para agendar uma conversa personalizada sobre seus objetivos financeiros.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #98ab44;">
            <h3 style="color: #98ab44; margin-top: 0;">Próximos Passos:</h3>
            <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Nossa equipe entrará em contato em até 24 horas úteis</li>
              <li>Agendaremos uma conversa para entender melhor seus objetivos</li>
              <li>Apresentaremos uma proposta personalizada para seu perfil</li>
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
            📧 contato@ldccapital.com.br | 📱 (51) 98930-1511
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
            Raízes no Interior. Olhos no Horizonte.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"LDC Capital" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: 'Obrigado pelo seu contato - LDC Capital',
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email de confirmação enviado:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}



