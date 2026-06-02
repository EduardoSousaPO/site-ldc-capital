'use client';

// Tokens
const ivy = { fontFamily: "var(--font-ivy-mode), Georgia, serif" } as const;
const sans = { fontFamily: "var(--font-public-sans), system-ui, sans-serif" } as const;
const ACCENT = '#98ab44';
const SURFACE = '#f8f8f6';
const INK = '#1a1f2e';
const NEUTRAL = '#577171';
const RULE = '#e8e8e4';
const NAVY = '#262d3d';

const LOGO_HR = '/images/LDC%20Capital%20-%20Logo%20Final_Aplica%C3%A7%C3%A3o%20Horizontal%20Colorida%20Branca.png';

// Correção 3 — reset de cor sobrescreve globals.css; demais regras de impressão
const PRINT_CSS = `
  /* Reset de cor — sobrescreve globals.css do site */
  #pdf-root p,
  #pdf-root span,
  #pdf-root li,
  #pdf-root div {
    color: inherit;
  }
  #pdf-root a {
    color: inherit !important;
    text-decoration: none !important;
  }

  @page { size: A4; margin: 0; }
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box;
  }
  .pdf-page {
    width: 210mm;
    min-height: 297mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .pdf-page:last-of-type { page-break-after: auto; }
  @media print {
    html, body { background: white !important; }
    .no-print { display: none !important; }
  }
  @media screen {
    #pdf-root { max-width: 210mm; margin: 0 auto; box-shadow: 0 4px 32px rgba(0,0,0,0.12); }
  }
`;

function Watermark({ n }: { n: string }) {
  return (
    <div style={{
      position: 'absolute', top: '10mm', right: '16mm',
      ...sans, fontSize: '72pt', fontWeight: 200,
      color: 'rgba(152,171,68,0.14)', lineHeight: 1,
      userSelect: 'none', pointerEvents: 'none',
    }}>
      {n}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-block', padding: '3px 10px',
      border: `1px solid ${ACCENT}`, borderRadius: '2px',
      ...sans, fontSize: '7.5pt', letterSpacing: '0.14em',
      textTransform: 'uppercase', color: ACCENT, marginBottom: '7mm',
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ width: '30mm', height: '1px', background: ACCENT, marginBottom: '8mm' }} />;
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${RULE}`,
      borderTop: `3px solid ${ACCENT}`, borderRadius: '2px',
      padding: '6mm 7mm', margin: '7mm 0',
    }}>
      {title && (
        <p style={{ ...sans, fontSize: '10.5pt', fontWeight: 600, color: INK, marginBottom: '3mm' }}>
          {title}
        </p>
      )}
      <div style={{ ...sans, fontSize: '10.5pt', color: '#3d4455', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

const bodyStyle = { ...sans, fontSize: '11pt', lineHeight: 1.75, color: INK, maxWidth: '155mm' } as const;
const pGap = { marginBottom: '5mm' } as const;

export default function GuiaPdfPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Correção 3 — color: INK no elemento raiz */}
      <div id="pdf-root" style={{ color: INK }}>

        {/* ── SEÇÃO 1 — CAPA ──────────────────────────────────────────── */}
        {/* Correções 1, 2 — logo maior + layout redistributído */}
        <section className="pdf-page" style={{
          background: NAVY,
          display: 'flex',
          flexDirection: 'column',
          padding: '14mm 18mm 10mm',
        }}>
          {/* Logo no topo */}
          <div style={{ paddingTop: '4mm' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_HR}
              alt="LDC Capital"
              style={{ height: '140px', width: 'auto', maxWidth: '360px', objectFit: 'contain' }}
            />
          </div>

          {/* Espaçador fixo */}
          <div style={{ flex: '0 0 28mm' }} />

          {/* Conteúdo principal */}
          <div style={{ flex: 1 }}>
            <p style={{ ...sans, fontSize: '9pt', letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '10mm' }}>
              Guia Executivo · LDC Capital
            </p>
            <h1 style={{ ...ivy, fontSize: '36pt', fontWeight: 600, color: '#ffffff', lineHeight: 1.15, marginBottom: '6mm' }}>
              O que os bankers de São Paulo compram com o próprio dinheiro
            </h1>
            <p style={{ ...ivy, fontSize: '16pt', fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
              e por que nunca vão te oferecer o mesmo
            </p>
          </div>

          {/* Rodapé da capa */}
          <div style={{ borderTop: '1px solid rgba(152,171,68,0.45)', paddingTop: '6mm' }}>
            <p style={{ ...sans, fontSize: '8.5pt', color: 'rgba(255,255,255,0.5)' }}>
              Luciano Herzog &nbsp;·&nbsp; CEO LDC Capital &nbsp;·&nbsp; CVM 3976-4 &nbsp;·&nbsp; R$400M+ sob consultoria
            </p>
          </div>
        </section>

        {/* ── SEÇÃO 2 — Por que eu posso falar sobre isso ────────────── */}
        <section className="pdf-page" style={{ background: SURFACE, padding: '18mm 20mm 16mm' }}>
          <Watermark n="01" />
          <Badge>Seção 01</Badge>

          <h2 style={{ ...ivy, fontSize: '28pt', fontWeight: 600, color: INK, lineHeight: 1.2, marginBottom: '3mm' }}>
            Por que eu posso falar sobre isso
          </h2>
          <Divider />

          <div style={bodyStyle}>
            <p style={pGap}>Meu nome é Luciano Herzog. Sou consultor de investimentos independente, autorizado pela CVM (registro 3976-4), e tenho R$400 milhões sob consultoria.</p>
            <p style={pGap}>Não trabalho para banco. Não tenho produto de prateleira para te vender. Não ganho comissão se você comprar fundo A ou fundo B.</p>
            <p style={pGap}>Isso muda tudo.</p>
            <p style={pGap}>Quando um gerente de banco te recomenda um investimento, ele está equilibrando dois interesses: o seu e o da instituição que paga o salário dele. Esses dois interesses raramente apontam para o mesmo lugar.</p>
            <p style={pGap}>Quando eu recomendo algo, existe um único interesse na equação: o seu patrimônio crescer, ser protegido e durar mais do que você.</p>
            <p style={pGap}>Esse guia é o que eu explico para todo novo cliente antes de começarmos a trabalhar juntos. É o que os profissionais do mercado sabem e raramente falam em público — porque falar em público afeta o negócio de muita gente.</p>
            <p>Se você tem patrimônio acima de R$500k investido, leia com atenção. Não porque eu quero impressionar. Porque você provavelmente está deixando dinheiro na mesa agora mesmo.</p>
          </div>
        </section>

        {/* ── SEÇÃO 3 — A conversa que seu banco evita ────────────────── */}
        <section className="pdf-page" style={{ background: SURFACE, padding: '18mm 20mm 16mm' }}>
          <Watermark n="02" />
          <Badge>Movimento 01 de 03</Badge>

          <h2 style={{ ...ivy, fontSize: '28pt', fontWeight: 600, color: INK, lineHeight: 1.2, marginBottom: '3mm' }}>
            A conversa que seu banco evita
          </h2>
          <p style={{ ...ivy, fontSize: '14pt', fontWeight: 400, fontStyle: 'italic', color: NEUTRAL, lineHeight: 1.4, marginBottom: '8mm', maxWidth: '140mm' }}>
            Seu dinheiro está preso no Brasil — e você não foi avisado disso.
          </p>
          <Divider />

          <div style={bodyStyle}>
            <p style={pGap}>Quando o Brasil vai bem, isso não aparece. Mas quando a taxa de câmbio dispara, quando o risco político aumenta, quando a inflação corrói os rendimentos reais — o investidor que tem tudo concentrado aqui sente na pele o que é dependência geográfica de patrimônio.</p>
            <p style={pGap}>Gestores independentes com patrimônio relevante não concentram tudo no Brasil. Não porque o Brasil seja um país ruim para investir — ele tem oportunidades reais. Mas porque concentração geográfica é risco desnecessário para quem já construiu um patrimônio.</p>

            <Callout title="Por que seu banco não te oferece isso?">
              <p>Diversificação internacional real exige que o banco abra mão de administrar uma parte do seu patrimônio. Quando seus recursos saem para uma conta no exterior, o banco perde a custódia, perde a taxa de administração, perde a receita de produtos atrelados àquele capital. Não é conspiração. É incentivo econômico.</p>
            </Callout>

            <p>Não estamos falando de contas offshore ilegais. Estamos falando de estruturação legal e declarada de ativos fora do Brasil — o que qualquer gestor independente habilitado pode organizar. A Receita Federal tem regras claras para isso. Quem tem R$500k+ e não consultou sobre essa possibilidade provavelmente está pagando mais imposto do que precisa e com mais concentração de risco do que deveria.</p>
          </div>
        </section>

        {/* ── SEÇÃO 4 — Planejamento financeiro real vs. venda de produto ─ */}
        <section className="pdf-page" style={{ background: SURFACE, padding: '18mm 20mm 16mm' }}>
          <Watermark n="03" />
          <Badge>Movimento 02 de 03</Badge>

          <h2 style={{ ...ivy, fontSize: '28pt', fontWeight: 600, color: INK, lineHeight: 1.2, marginBottom: '3mm' }}>
            Planejamento financeiro real vs. venda de produto
          </h2>
          <p style={{ ...ivy, fontSize: '14pt', fontWeight: 400, fontStyle: 'italic', color: NEUTRAL, lineHeight: 1.4, marginBottom: '8mm', maxWidth: '140mm' }}>
            Existe uma diferença entre um consultor financeiro e um vendedor de produtos financeiros — e o mercado tem interesse em que você não a compreenda.
          </p>
          <Divider />

          <div style={bodyStyle}>
            <p style={pGap}>Um vendedor de produtos financeiros recebe remuneração baseada no volume de produtos que coloca na carteira dos clientes. Quanto mais produtos, melhor para ele.</p>
            <p style={pGap}>Um consultor financeiro independente registrado na CVM tem obrigação fiduciária — legal e ética — de agir no melhor interesse do cliente. A remuneração vem do cliente, não dos produtos.</p>

            <Callout title="">
              <p style={{ ...sans, fontSize: '10.5pt', color: '#3d4455', lineHeight: 1.7, marginBottom: '4mm' }}>
                O vendedor pergunta: <em>&ldquo;Qual é o seu perfil de risco?&rdquo;</em> — para encaixar você numa categoria de produto.
              </p>
              <p style={{ ...sans, fontSize: '10.5pt', color: '#3d4455', lineHeight: 1.7 }}>
                O consultor independente pergunta: <em>&ldquo;Quais são seus objetivos de vida daqui a 5, 10 e 20 anos? O que você quer que esse patrimônio faça por você e pela sua família?&rdquo;</em> — para construir uma estratégia que sirva a esses objetivos.
              </p>
            </Callout>

            <p style={{ ...sans, fontSize: '11pt', fontWeight: 600, color: INK, marginTop: '5mm', marginBottom: '3mm' }}>
              O que planejamento financeiro real inclui:
            </p>
            <ul style={{ paddingLeft: '5mm', listStyleType: 'disc', color: INK }}>
              {[
                'Diagnóstico completo do patrimônio atual',
                'Projeção de independência financeira com base nos seus objetivos reais',
                'Estrutura tributária eficiente',
                'Diversificação por tipo de ativo, por geografia, por liquidez',
                'Revisão periódica — o plano muda conforme a vida muda',
              ].map((item) => (
                <li key={item} style={{ marginBottom: '2mm', lineHeight: 1.75 }}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── SEÇÃO 5 — Sucessão patrimonial ──────────────────────────── */}
        <section className="pdf-page" style={{ background: SURFACE, padding: '18mm 20mm 16mm' }}>
          <Watermark n="04" />
          <Badge>Movimento 03 de 03</Badge>

          <h2 style={{ ...ivy, fontSize: '28pt', fontWeight: 600, color: INK, lineHeight: 1.2, marginBottom: '3mm' }}>
            Sucessão patrimonial — a conversa que ninguém tem até ser tarde
          </h2>
          <p style={{ ...ivy, fontSize: '14pt', fontWeight: 400, fontStyle: 'italic', color: NEUTRAL, lineHeight: 1.4, marginBottom: '8mm', maxWidth: '140mm' }}>
            A maioria das famílias brasileiras com patrimônio relevante não tem estrutura sucessória organizada.
          </p>
          <Divider />

          <div style={bodyStyle}>
            <p style={pGap}>Não porque as pessoas não se importam com o que acontece com o que construíram. Mas porque falar sobre sucessão parece sinistro — como se pensar nisso fosse apressar alguma coisa.</p>
            <p style={pGap}>O resultado: famílias que levaram 30 anos construindo patrimônio veem parte dele ser consumida em inventário, disputas entre herdeiros ou tributação desnecessária em questão de meses.</p>

            <Callout title="O que acontece sem planejamento sucessório:">
              <ul style={{ paddingLeft: '4mm', listStyleType: 'disc', color: '#3d4455' }}>
                {[
                  'Inventário pode levar anos e consumir parte significativa do patrimônio',
                  'Bens no exterior sem estrutura adequada entram em processo de probate',
                  'Empresas familiares sem governance definida frequentemente não sobrevivem à transição',
                ].map((item) => (
                  <li key={item} style={{ marginBottom: '2mm', lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </Callout>

            <p style={pGap}>Não é só fazer um testamento. É estruturar como o patrimônio vai ser transferido de forma eficiente, com menor carga tributária possível, preservando o que foi construído para quem você quer que receba.</p>
            <p>Na LDC Capital, o planejamento sucessório é parte integrante do atendimento — não um serviço separado que se contrata quando o assunto já se tornou urgente.</p>
          </div>
        </section>

        {/* ── SEÇÃO 6 — CTA FINAL ─────────────────────────────────────── */}
        {/* Correções 4, 5 — logo maior + layout com espaçadores distribuídos */}
        <section className="pdf-page" style={{
          background: NAVY,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16mm 24mm 16mm',
          textAlign: 'center',
        }}>
          {/* Logo — ancorado no topo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_HR}
            alt="LDC Capital"
            style={{ height: '120px', width: 'auto', maxWidth: '320px', objectFit: 'contain', marginBottom: '0' }}
          />

          {/* Espaçador antes do conteúdo */}
          <div style={{ flex: '0 0 20mm' }} />

          <h2 style={{ ...ivy, fontSize: '28pt', fontWeight: 600, color: '#ffffff', marginBottom: '8mm' }}>
            O que fazer agora
          </h2>

          <p style={{ ...sans, fontSize: '11.5pt', fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, maxWidth: '130mm', marginBottom: '12mm' }}>
            Se você tem patrimônio acima de R$500k e nunca discutiu nenhum desses três movimentos com seu assessor — o próximo passo é simples.<br /><br />
            Uma conversa. Não é uma reunião de vendas.<br />
            É um diagnóstico gratuito de 30 minutos.
          </p>

          <div style={{
            background: ACCENT, padding: '5mm 20mm',
            borderRadius: '2px', marginBottom: '14mm',
            display: 'inline-block',
          }}>
            <p style={{ ...sans, fontSize: '11pt', fontWeight: 600, color: INK, letterSpacing: '0.04em' }}>
              ldccapital.com.br/guia
            </p>
          </div>

          <div style={{ width: '60mm', height: '1px', background: 'rgba(255,255,255,0.15)', marginBottom: '6mm' }} />

          <p style={{
            ...sans, fontSize: '7pt', color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.6, maxWidth: '150mm', marginBottom: '5mm',
            textAlign: 'center',
          }}>
            Este material tem caráter exclusivamente informativo e educacional. Não constitui oferta, recomendação ou análise individualizada de valores mobiliários, nem promessa de rentabilidade. Decisões de investimento devem considerar perfil, objetivos e situação patrimonial de cada investidor — consulte um consultor de valores mobiliários habilitado pela CVM antes de qualquer decisão.
          </p>

          <p style={{ ...sans, fontSize: '8pt', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            LDC Capital &nbsp;·&nbsp; CVM 3976-4 &nbsp;·&nbsp; ldccapital.com.br<br />
            &ldquo;Mais do que finanças, direção.&rdquo;
          </p>

        </section>

      </div>

      {/* Botão flutuante — oculto na impressão */}
      <button
        onClick={() => window.print()}
        className="no-print fixed bottom-6 right-6 z-50 print:hidden
                   flex items-center gap-2 px-5 py-3
                   bg-[#98ab44] text-[#262d3d] font-sans font-bold text-sm
                   rounded shadow-lg hover:bg-[#becc6a] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Salvar como PDF
      </button>
    </>
  );
}
