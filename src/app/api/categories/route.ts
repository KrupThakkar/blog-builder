import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { getSessionFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || "",
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    await connectDB();
    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: "Category deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
