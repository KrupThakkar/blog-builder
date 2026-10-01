import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { Comment } from "@/models/Comment";
import { getSessionFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const comments = await Comment.find({ blog: blog._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ comments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load comments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
    const body = await request.json();
    const { authorName, authorEmail, content } = body;

    const name = session?.name || authorName;
    const email = session?.email || authorEmail || "";

    if (!name || !content?.trim()) {
      return NextResponse.json(
        { error: "Author name and comment content are required" },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      blog: blog._id,
      authorName: name.trim(),
      authorEmail: email.trim().toLowerCase(),
      user: session?.userId || undefined,
      content: content.trim(),
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post comment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to delete comments" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    const comment = await Comment.findOne({ _id: commentId, blog: blog._id });
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Permission check: Comment author, Blog author, or Admin
    const isCommentAuthor =
      (comment.user && comment.user.toString() === session.userId) ||
      (comment.authorEmail && comment.authorEmail.toLowerCase() === session.email.toLowerCase());
    const isBlogAuthor = blog.author && blog.author.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isCommentAuthor && !isBlogAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this comment" },
        { status: 403 }
      );
    }

    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ success: true, message: "Comment deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete comment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

