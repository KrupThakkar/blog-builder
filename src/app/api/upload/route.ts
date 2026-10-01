import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSessionFromRequest } from "@/lib/auth";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to upload files" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG are supported." },
        { status: 400 }
      );
    }

    // Validate size (max 10MB for Cloudinary, 5MB for local)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. If Cloudinary credentials are provided, upload to Cloudinary CDN
    if (isCloudinaryConfigured()) {
      const base64Data = buffer.toString("base64");
      const fileUri = `data:${file.type};base64,${base64Data}`;

      const uploadResult = await cloudinary.uploader.upload(fileUri, {
        folder: "blog_builder",
        resource_type: "image",
      });

      return NextResponse.json({
        url: uploadResult.secure_url,
        name: file.name,
        size: file.size,
        provider: "cloudinary",
        public_id: uploadResult.public_id,
      });
    }

    // 2. Fallback: Save to local filesystem if Cloudinary is not yet configured
    const ext = path.extname(file.name) || ".png";
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFilename = `${cleanBase}-${Date.now()}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
      size: file.size,
      provider: "local",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

