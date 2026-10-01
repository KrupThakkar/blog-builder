"use client";

import React, { useState, useEffect } from "react";
import { Heart, MessageSquare, Share2, Check, Send, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

interface CommentItem {
  _id: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
  user?: string;
}

interface BlogInteractionsProps {
  slug: string;
  initialLikes: string[];
  initialViews?: number;
}

export function BlogInteractions({
  slug,
  initialLikes,
}: BlogInteractionsProps) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(initialLikes.length);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState(user?.name || "");
  const [authorEmail, setAuthorEmail] = useState(user?.email || "");
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check if current user liked
  useEffect(() => {
    if (user && initialLikes.includes(user.id)) {
      setHasLiked(true);
    }
  }, [user, initialLikes]);

  // Load comments
  useEffect(() => {
    async function loadComments() {
      try {
        const res = await fetch(`/api/blogs/${slug}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch {
        // ignore
      } finally {
        setCommentsLoading(false);
      }
    }
    loadComments();
  }, [slug]);

  // Sync author name if user logs in
  useEffect(() => {
    if (user) {
      setAuthorName(user.name);
      setAuthorEmail(user.email);
    }
  }, [user]);

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    try {
      const res = await fetch(`/api/blogs/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: user?.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasLiked(data.liked);
        setLikesCount(data.likesCount);

        if (data.liked) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Handle Comment Submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !authorName.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/blogs/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          content: commentContent.trim(),
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentContent("");
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/blogs/${slug}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete comment");
      }

      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 space-y-12">
      {/* Interaction Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-850 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              hasLiked
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-rose-600 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
              } transition-transform`}
            />
            <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
          </button>

          {/* Comment Count Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-3 py-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>{comments.length} Discussion{comments.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        {/* Share Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Story</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Discussion & Comments Section */}
      <section className="space-y-8">
        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Discussion & Insights
            <span className="text-sm font-semibold text-gray-400">({comments.length})</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Join the conversation with engineering peers and analysts.
          </p>
        </div>

        {/* Comment Input Box */}
        <form
          onSubmit={handleSubmitComment}
          className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Your Email (Optional)
              </label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Add to the discussion <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="What are your thoughts on this architecture or trend?"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-y placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {commentSuccess ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Comment posted successfully!
              </span>
            ) : (
              <span className="text-xs text-gray-400">Be constructive and respectful</span>
            )}

            <button
              type="submit"
              disabled={submittingComment || !commentContent.trim() || !authorName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingComment ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        <div className="space-y-4">
          {commentsLoading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6">
              <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No comments yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Be the first to share your perspectives on this article!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete =
                user &&
                (user.role === "admin" ||
                  user.id === comment.user ||
                  (comment.authorEmail &&
                    user.email?.toLowerCase() === comment.authorEmail.toLowerCase()));

              return (
                <div
                  key={comment._id}
                  className="p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          comment.authorName
                        )}`}
                        alt={comment.authorName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {comment.authorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={deletingCommentId === comment._id}
                          title="Delete comment"
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-9">
                    {comment.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
