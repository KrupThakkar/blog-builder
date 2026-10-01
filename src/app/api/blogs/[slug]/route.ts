import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";
import { calculateReadTime, slugify, stripHtml, truncate } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug }).populate(
      "author",
      "name email role avatar bio"
    );

    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const session = getSessionFromRequest(request);

    // If draft, only author or admin can view
    if (blog.status === "draft") {
      const isAuthor = session && blog.author && (blog.author as { _id: { toString(): string } })._id.toString() === session.userId;
      const isAdmin = session?.role === "admin";
      if (!isAuthor && !isAdmin) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
    }

    // Increment views asynchronously if it's a published post
    if (blog.status === "published") {
      await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
      blog.views += 1;
    }

    return NextResponse.json(blog);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch blog post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Check authorization: author or admin
    const isAuthor = blog.author.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this post" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      coverImage,
      category,
      tags,
      status,
      newSlug,
    } = body;

    if (title) blog.title = title;
    if (content) {
      blog.content = content;
      blog.readTime = calculateReadTime(content);
    }
    if (excerpt !== undefined) {
      blog.excerpt = excerpt ? excerpt.trim() : truncate(stripHtml(blog.content), 160);
    }
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (category) blog.category = category.trim();
    if (tags && Array.isArray(tags)) {
      blog.tags = tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean);
    }

    if (status && (status === "published" || status === "draft")) {
      if (status === "published" && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
      blog.status = status;
    }

    // Update slug if requested and unique
    if (newSlug && slugify(newSlug) !== blog.slug) {
      const candidateSlug = slugify(newSlug);
      const existingWithSlug = await Blog.findOne({
        slug: candidateSlug,
        _id: { $ne: blog._id },
      });
      if (existingWithSlug) {
        return NextResponse.json(
          { error: "Slug is already in use by another article" },
          { status: 409 }
        );
      }
      blog.slug = candidateSlug;
    }

    await blog.save();

    const updated = await Blog.findById(blog._id).populate(
      "author",
      "name email role avatar bio"
    );

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Author or admin can delete
    const isAuthor = blog.author.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this post" },
        { status: 403 }
      );
    }

    await Blog.findByIdAndDelete(blog._id);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
