import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import "@/models/User"; // Ensure User model is registered for populate
import { getSessionFromRequest } from "@/lib/auth";
import { calculateReadTime, slugify, stripHtml, truncate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "9", 10)));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const tag = searchParams.get("tag") || "";
    const statusParam = searchParams.get("status") || "published";
    const authorId = searchParams.get("author") || "";
    const sortParam = searchParams.get("sort") || "latest";

    const session = getSessionFromRequest(request);

    // Build filter query
    function escapeRegex(text: string) {
      return text.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];

    // Handle status filtering and permissions
    if (statusParam === "all") {
      if (!session) {
        conditions.push({ status: "published" });
      } else if (session.role === "admin") {
        // admin can view all
      } else {
        // employee can view published or their own drafts
        conditions.push({
          $or: [{ status: "published" }, { author: session.userId }],
        });
      }
    } else if (statusParam === "draft") {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      conditions.push({ status: "draft" });
      if (session.role !== "admin") {
        conditions.push({ author: session.userId });
      }
    } else {
      conditions.push({ status: "published" });
    }

    if (authorId) {
      conditions.push({ author: authorId });
    }

    if (category && category !== "All") {
      const escapedCategory = escapeRegex(category);
      conditions.push({ category: { $regex: new RegExp(`^${escapedCategory}$`, "i") } });
    }

    if (tag) {
      conditions.push({ tags: { $in: [tag] } });
    }

    if (search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      conditions.push({
        $or: [
          { title: searchRegex },
          { excerpt: searchRegex },
          { tags: searchRegex },
          { category: searchRegex },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    // Determine sort
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortParam === "popular") {
      sortObj = { views: -1, createdAt: -1 };
    } else if (sortParam === "likes") {
      sortObj = { likesCount: -1, createdAt: -1 };
    } else {
      sortObj = { publishedAt: -1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate("author", "name email role avatar bio")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch blogs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to create a blog" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      coverImage,
      category,
      tags = [],
      status = "draft",
      customSlug,
    } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(customSlug || title);
    if (!baseSlug) baseSlug = "post-" + Date.now();
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await Blog.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Clean tags
    const cleanedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt?.trim()
      ? excerpt.trim()
      : truncate(stripHtml(content), 160);

    const readTime = calculateReadTime(content);

    const blog = await Blog.create({
      title,
      slug: uniqueSlug,
      content,
      excerpt: finalExcerpt,
      coverImage: coverImage || "",
      category: category.trim(),
      tags: cleanedTags,
      author: session.userId,
      status: status === "published" ? "published" : "draft",
      readTime,
      publishedAt: status === "published" ? new Date() : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blogId = (blog as any)._id;
    const populatedBlog = await Blog.findById(blogId).populate(
      "author",
      "name email role avatar bio"
    );

    return NextResponse.json(populatedBlog, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
