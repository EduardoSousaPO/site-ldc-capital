import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
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
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      content,
      category, 
      type,
      cover, 
      fileUrl,
      fileName,
      fileSize,
      pages,
      published,
      featured
    } = body;

    const updateData: {
      title?: string;
      slug?: string;
      description?: string;
      content?: string;
      category?: string;
      type?: string;
      cover?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: string;
      pages?: number | null;
      published?: boolean;
      featured?: boolean;
      publishedAt?: Date | null;
    } = {};
    
    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changes
      updateData.slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    }
    
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type;
    if (cover !== undefined) updateData.cover = cover;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (pages !== undefined) updateData.pages = pages ? parseInt(pages) : null;
    if (featured !== undefined) updateData.featured = featured;
    
    if (published !== undefined) {
      updateData.published = published;
      if (published) {
        updateData.publishedAt = new Date();
      } else {
        updateData.publishedAt = null;
      }
    }

    const { id } = await params;
    const material = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(material);
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
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.material.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
