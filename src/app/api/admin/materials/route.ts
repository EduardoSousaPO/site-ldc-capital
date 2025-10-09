import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry, ensurePrismaConnection } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/auth-check";

export async function GET() {
  try {
    console.log("Starting materials fetch...");
    
    const user = await checkAdminAuth();
    console.log("Auth check result:", user ? "authenticated" : "not authenticated");
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching materials from database...");
    const materials = await withRetry(async () => {
      await ensurePrismaConnection();
      return await prisma.material.findMany({
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    console.log(`Found ${materials.length} materials`);
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdminAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, category, type, cover, fileUrl, fileName, fileSize, pages, published, featured } = body;

    if (!title || !category || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const newMaterial = await withRetry(async () => {
      await ensurePrismaConnection();
      return await prisma.material.create({
        data: {
          title,
          slug,
          description,
          content,
          category,
          type,
          cover,
          fileUrl,
          fileName,
          fileSize,
          pages: pages ? parseInt(pages) : null,
          published: published || false,
          featured: featured || false,
          authorId: user.id,
          publishedAt: published ? new Date() : null,
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
    });

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}