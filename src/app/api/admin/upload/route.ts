import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

async function checkAuth() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const userRole = user.user_metadata?.role;
  if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name,
    role: userRole
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as File | null;
    const type = (data.get("type") as string) || "image";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for documents
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json({ 
        error: `File size too large. Maximum size: ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isImageType = type === 'image' || type === 'cover';
    const isDocType = type === 'document' || type === 'material';
    
    if (isImageType && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid image type. Allowed: JPG, PNG, WebP" 
      }, { status: 400 });
    }
    
    if (isDocType && !allowedDocTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid document type. Allowed: PDF, DOC, DOCX, XLS, XLSX" 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabaseAdmin = createSupabaseAdminClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;

    if (!bucket) {
      return NextResponse.json({ error: "Storage bucket not configured" }, { status: 500 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const folder = (type === 'image' || type === 'cover') ? 'images' : 'materials';
    const filePath = `${folder}/${randomUUID()}-${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
      filename: sanitizedName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Failed to upload file" 
    }, { status: 500 });
  }
}
