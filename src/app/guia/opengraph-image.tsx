import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Guia Executivo — O que os bankers de São Paulo compram com o próprio dinheiro | LDC Capital';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 70px',
          background: '#262d3d',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              border: '1px solid rgba(152,171,68,0.5)',
              borderRadius: '4px',
            }}
          >
            <span style={{ color: '#98ab44', fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
              Guia Executivo · LDC Capital
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            CVM 3976-4
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: 0,
              maxWidth: '800px',
            }}
          >
            O que os bankers de São Paulo compram com o próprio dinheiro
          </h1>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#98ab44',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            e por que nunca vão te oferecer o mesmo
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(152,171,68,0.3)',
            paddingTop: '24px',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
            Guia gratuito para patrimônio acima de R$500k
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Luciano Herzog · R$400M+ sob consultoria
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
