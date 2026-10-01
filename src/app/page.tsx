"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Tag,
  ArrowRight,
  RefreshCw,
  Flame,
} from "lucide-react";
import { BlogCard, BlogItem } from "@/components/BlogCard";

export default function HomePage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "likes">("latest");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch blogs
  const fetchBlogs = useCallback(
    async (currentPage = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", "9");
        params.set("sort", sortBy);
        params.set("status", "published");

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedCategory && selectedCategory !== "All")
          params.set("category", selectedCategory);
        if (selectedTag) params.set("tag", selectedTag);

        const res = await fetch(`/api/blogs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setBlogs((prev) => [...prev, ...data.blogs]);
          } else {
            setBlogs(data.blogs || []);
          }
          setHasMore(data.pagination?.hasMore || false);
        }
      } catch (err) {
        console.error("Failed to load blogs", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedCategory, selectedTag, sortBy]
  );

  useEffect(() => {
    fetchBlogs(1, false);
    setPage(1);
  }, [fetchBlogs]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(nextPage, true);
  };

  const categories = [
    "All",
    "Data & Analytics",
    "Careers & Tech",
    "Productivity",
    "Engineering",
  ];

  const popularTags = [
    "analytics",
    "business intelligence",
    "data trends",
    "full-stack development",
    "hiring",
    "developer habits",
    "productivity",
  ];

  const featuredBlog = blogs.length > 0 && !debouncedSearch && selectedCategory === "All" && !selectedTag ? blogs[0] : null;
  const standardBlogs = featuredBlog ? blogs.slice(1) : blogs;

  return (
    <div className="flex-1 pb-20">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-b from-indigo-50/40 via-transparent to-transparent dark:from-indigo-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Engineering & Analytics Journal
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.12]">
              Architectural Insights & Technical Clarity.
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
              High-impact engineering articles, real-time data strategy, and modern developer culture published by the AnalyticsLiv team.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-3 p-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg shadow-indigo-950/5">
            {/* Search Input */}
            <div className="md:col-span-6 relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Search articles by title, keyword, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Category Select on mobile / Sort on desktop */}
            <div className="md:col-span-3 flex items-center">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="md:col-span-3 flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "latest" | "popular" | "likes")}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="latest">Sort: Latest First</option>
                <option value="popular">Sort: Most Views</option>
                <option value="likes">Sort: Most Liked</option>
              </select>
            </div>
          </div>

          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                    : "bg-white dark:bg-gray-850 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}

            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag("")}
                className="whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
              >
                <span>Tag: #{selectedTag}</span>
                <span className="font-bold">✕</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Featured Story (If on home without filters) */}
        {featuredBlog && !loading && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Flame className="w-4 h-4 text-amber-500" />
              Featured Cover Story
            </div>
            <BlogCard blog={featuredBlog} featured />
          </div>
        )}

        {/* Story Grid Heading */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {selectedCategory !== "All"
                ? `${selectedCategory} Stories`
                : selectedTag
                ? `Tagged with #${selectedTag}`
                : "Recent Stories"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Explore perspectives, guides, and engineering practices.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span>{blogs.length} stories found</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 animate-pulse"
              >
                <div className="aspect-[16/9] rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-full w-1/4 pt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="text-center py-20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              No matching stories found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
              Try adjusting your search keywords, clearing your filters, or publish a new article.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                  setSelectedTag("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Clear Filters
              </button>
              <Link
                href="/editor"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create a Story
              </Link>
            </div>
          </div>
        )}

        {/* Stories Grid */}
        {!loading && standardBlogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {standardBlogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        )}

        {/* Load More / Pagination Button */}
        {hasMore && !loading && (
          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  Loading more stories...
                </>
              ) : (
                <>
                  Load More Stories
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Tag Cloud & Topics Footer Banner */}
        <div id="categories" className="mt-20 p-8 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                Trending Topics & Tags
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Filter by specialized subject matter and tech focus areas.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(tag);
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    selectedTag === tag
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
