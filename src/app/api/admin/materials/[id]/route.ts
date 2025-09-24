import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

async function checkAuth() {
  const supabase = createSupabaseServerClient();
  
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, content, category, type, cover, fileUrl, fileName, fileSize, pages, published, featured } = body;

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Generate new slug if title changed
    let slug = existingMaterial.slug;
    if (title && title !== existingMaterial.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: {
        ...(title && { title, slug }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(category && { category }),
        ...(type && { type }),
        ...(cover !== undefined && { cover }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(pages !== undefined && { pages: pages ? parseInt(pages) : null }),
        ...(published !== undefined && { 
          published, 
          publishedAt: published && !existingMaterial.published ? new Date() : existingMaterial.publishedAt 
        }),
        ...(featured !== undefined && { featured }),
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}