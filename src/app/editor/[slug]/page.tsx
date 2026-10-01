"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BlogEditor } from "@/components/BlogEditor";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [blogData, setBlogData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/editor/${slug}`);
      return;
    }

    async function loadPost() {
      try {
        const res = await fetch(`/api/blogs/${slug}`);
        if (!res.ok) {
          throw new Error("Failed to load blog post");
        }
        const data = await res.json();

        // Check ownership or admin
        const authorId = typeof data.author === "object" ? data.author._id : data.author;
        if (user && user.role !== "admin" && authorId !== user.id) {
          setError("You do not have permission to edit this post.");
          return;
        }

        setBlogData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error loading post";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadPost();
    }
  }, [user, authLoading, router, slug]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Loading story editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{error}</h2>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 py-4">
      <BlogEditor initialData={blogData} isEditing />
    </div>
  );
}
