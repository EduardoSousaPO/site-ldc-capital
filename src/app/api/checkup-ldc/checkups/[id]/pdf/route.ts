import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { generatePDF } from '@/features/checkup-ldc/pdf/generator';

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

    // PDF só pode ser gerado após pagamento
    if (checkup.status !== 'paid' && checkup.status !== 'done') {
      return NextResponse.json(
        { error: 'Checkup must be paid to generate PDF' },
        { status: 403 }
      );
    }

    if (!checkup.analytics_json || !checkup.report_json) {
      return NextResponse.json(
        { error: 'Report not ready' },
        { status: 400 }
      );
    }

    // Gerar PDF
    const pdfBuffer = await generatePDF(
      id,
      checkup.score_total || 0,
      checkup.analytics_json,
      checkup.report_json
    );

    // Upload para Supabase Storage
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'ldc-assets';
    const fileName = `checkup-${id}-${Date.now()}.pdf`;
    const filePath = `checkups/${fileName}`;

    // Verificar se bucket existe, criar se não existir
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.find(b => b.name === bucket);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['application/pdf'],
      });
      if (createError) {
        console.error('Error creating bucket:', createError);
      }
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Permitir sobrescrever se já existir
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    // Atualizar checkup com URL do PDF
    await supabase
      .from('Checkup')
      .update({ pdf_url: pdfUrl })
      .eq('id', id);

    return NextResponse.json({ pdf_url: pdfUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

