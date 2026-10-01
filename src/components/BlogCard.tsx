"use client";

import React from "react";
import Link from "next/link";
import { Clock, Heart, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Author {
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: Author;
  status: "draft" | "published";
  readTime: number;
  views: number;
  likes: string[];
  publishedAt?: string;
  createdAt: string;
}

interface BlogCardProps {
  blog: BlogItem;
  featured?: boolean;
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  const authorName = blog.author?.name || "AnalyticsLiv Author";
  const authorAvatar =
    blog.author?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  if (featured) {
    return (
      <article className="group relative rounded-3xl overflow-hidden border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              blog.coverImage ||
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80"
            }
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur-md shadow-sm border border-white/20">
              {blog.category}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {blog.readTime || 1} min read
              </span>
            </div>

            <Link href={`/blog/${blog.slug}`} className="block group/link">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-snug group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
                {blog.title}
              </h2>
            </Link>

            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
              {blog.excerpt}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {authorName}
                </p>
                <p className="text-[11px] text-gray-500 capitalize">
                  {blog.author?.role || "Contributor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-500/70" />
                {blog.likes?.length || 0}
              </span>
              <Link
                href={`/blog/${blog.slug}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard Card
  return (
    <article className="group flex flex-col rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Cover Image Container */}
      <Link
        href={`/blog/${blog.slug}`}
        className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800 block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            blog.coverImage ||
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80"
          }
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur-md shadow-sm border border-white/20">
            {blog.category}
          </span>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-indigo-500" />
              {blog.readTime || 1} min read
            </span>
          </div>

          {/* Title */}
          <Link href={`/blog/${blog.slug}`} className="block group/title">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors line-clamp-2">
              {blog.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {blog.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
              {authorName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500/70" />
              {blog.likes?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
