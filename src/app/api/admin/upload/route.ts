import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const type = data.get("type") as string; // "material" or "cover"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Max size is 50MB" }, { status: 400 });
    }

    // Validate file types
    const allowedTypes = {
      material: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
        "application/vnd.ms-excel", // xls
        "application/msword", // doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
        "text/plain"
      ],
      cover: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
      ]
    };

    const validTypes = type === "cover" ? allowedTypes.cover : allowedTypes.material;
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${validTypes.join(", ")}` 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${cleanName}`;

    // Create directory structure
    const uploadDir = type === "cover" 
      ? join(process.cwd(), "public", "uploads", "covers")
      : join(process.cwd(), "public", "uploads", "materials");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = type === "cover"
      ? `/uploads/covers/${filename}`
      : `/uploads/materials/${filename}`;

    // Format file size
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: formatFileSize(file.size),
      type: file.type
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
