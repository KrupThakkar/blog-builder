"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BlogEditor } from "@/components/BlogEditor";

export default function NewPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/editor");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Checking editorial permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-4">
      <BlogEditor />
    </div>
  );
}
