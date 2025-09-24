import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    // Criar usuário admin
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@ldccapital.com.br',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador LDC Capital',
        role: 'ADMIN'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ 
        error: 'Failed to create admin user',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role
      },
      credentials: {
        email: 'admin@ldccapital.com.br',
        password: 'admin123'
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
