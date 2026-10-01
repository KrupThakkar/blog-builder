import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye, Calendar, ArrowLeft, PenSquare, AlertTriangle } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import "@/models/User";
import { formatDate } from "@/lib/utils";
import { BlogInteractions } from "@/components/BlogInteractions";
import { BlogCard, BlogItem } from "@/components/BlogCard";
import { getServerSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();
  const blog = await Blog.findOne({ slug }).lean();

  if (!blog) {
    return {
      title: "Story Not Found | AnalyticsLiv",
    };
  }

  return {
    title: `${blog.title} | AnalyticsLiv Editorial`,
    description: blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();
  const session = await getServerSession();

  // Find blog post
  const blogDoc = await Blog.findOne({ slug }).populate(
    "author",
    "name email role avatar bio"
  );

  if (!blogDoc) {
    notFound();
  }

  // Check draft permissions: only author or admin can view drafts
  const isDraft = blogDoc.status === "draft";
  if (isDraft) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authorId = (blogDoc.author as any)?._id?.toString() || (blogDoc.author as any)?.id?.toString();
    const isAuthor = session && authorId === session.userId;
    const isAdmin = session?.role === "admin";
    if (!isAuthor && !isAdmin) {
      notFound();
    }
  } else {
    // Increment view count for published posts
    await Blog.findByIdAndUpdate(blogDoc._id, { $inc: { views: 1 } });
    blogDoc.views += 1;
  }

  // Fetch related posts in the same category or by the same author
  const rawRelatedBlogs = await Blog.find({
    _id: { $ne: blogDoc._id },
    status: "published",
    $or: [{ category: blogDoc.category }, { author: blogDoc.author }],
  })
    .populate("author", "name email role avatar bio")
    .limit(3)
    .lean();

  // Deeply serialize relatedBlogs to plain JSON objects for Client Components
  const serializedRelatedBlogs = JSON.parse(JSON.stringify(rawRelatedBlogs));
  const serializedLikes = JSON.parse(JSON.stringify(blogDoc.likes || []));

  const author = blogDoc.author as {
    _id?: { toString(): string };
    name: string;
    email: string;
    role: string;
    avatar?: string;
    bio?: string;
  };

  const authorName = author?.name || "AnalyticsLiv Author";
  const authorAvatar =
    author?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  return (
    <article className="flex-1 pb-24">
      {/* Draft Mode Notification Banner */}
      {isDraft && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-800 dark:text-amber-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <strong>Draft Mode:</strong> This story is currently unpublished and only visible to you.
            </span>
            <Link
              href={`/editor/${blogDoc.slug}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-bold transition-colors"
            >
              <PenSquare className="w-3.5 h-3.5" />
              Edit & Publish
            </Link>
          </div>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <header className="border-b border-gray-100 dark:border-gray-800/80 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to all stories
            </Link>

            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              {blogDoc.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.2] mb-6">
            {blogDoc.title}
          </h1>

          {/* Subtitle / Excerpt */}
          {blogDoc.excerpt && (
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-normal mb-8">
              {blogDoc.excerpt}
            </p>
          )}

          {/* Author Byline & Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {authorName}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {author?.role || "Contributor"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-md">
                  {author?.bio || "Engineering writer at AnalyticsLiv"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                {formatDate(blogDoc.publishedAt || blogDoc.createdAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {blogDoc.readTime || 1} min read
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                {blogDoc.views} views
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Blog Body Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Cover Image */}
        {blogDoc.coverImage && (
          <div className="mb-12 rounded-3xl overflow-hidden shadow-lg border border-gray-200/80 dark:border-gray-800 aspect-[16/9] bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blogDoc.coverImage}
              alt={blogDoc.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Prose Content (Judged for Readability) */}
        <div
          className="blog-content max-w-3xl mx-auto text-lg leading-relaxed text-gray-800 dark:text-gray-200"
          dangerouslySetInnerHTML={{ __html: blogDoc.content }}
        />

        {/* Tags Section */}
        {blogDoc.tags && blogDoc.tags.length > 0 && (
          <div className="max-w-3xl mx-auto mt-12 pt-6 border-t border-gray-200/80 dark:border-gray-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">
              Tags:
            </span>
            {blogDoc.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-gray-600 dark:text-gray-300 font-medium transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Author Bio Box */}
        <div className="max-w-3xl mx-auto mt-12 p-6 rounded-2xl bg-gray-50/70 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/20 flex-shrink-0"
          />
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Written by
            </span>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              {authorName}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {author?.bio ||
                "Contributor to the AnalyticsLiv engineering and data intelligence publications."}
            </p>
          </div>
        </div>

        {/* Interactive Likes, Share, and Comments */}
        <div className="max-w-3xl mx-auto">
          <BlogInteractions
            slug={blogDoc.slug}
            initialLikes={serializedLikes}
            initialViews={blogDoc.views || 0}
          />
        </div>
      </div>

      {/* Related Stories Section */}
      {serializedRelatedBlogs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Recommended Reading
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                More insightful perspectives on {blogDoc.category}
              </p>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Explore all stories →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serializedRelatedBlogs.map((b: BlogItem) => (
              <BlogCard key={b._id} blog={b} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
