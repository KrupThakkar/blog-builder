import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const session = getSessionFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const identifier = session?.userId || body.identifier || request.headers.get("x-forwarded-for") || "anonymous_user";

    const hasLiked = blog.likes.includes(identifier);

    if (hasLiked) {
      blog.likes = blog.likes.filter((id) => id !== identifier);
    } else {
      blog.likes.push(identifier);
    }

    await blog.save();

    return NextResponse.json({
      liked: !hasLiked,
      likesCount: blog.likes.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to toggle like";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
