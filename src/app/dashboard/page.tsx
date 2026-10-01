"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Users,
  Eye,
  Heart,
  Plus,
  PenSquare,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Tag,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EmployeeItem {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  totalPosts: number;
  publishedPosts: number;
  createdAt: string;
}

interface AdminStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalEmployees: number;
  totalViews: number;
  totalLikes: number;
  mostActiveEmployee: {
    name: string;
    email: string;
    avatar: string;
    publishedCount: number;
    totalViews: number;
  } | null;
  categoryBreakdown: { category: string; count: number }[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"posts" | "employees" | "categories">("posts");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Admin data
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);

  // New Employee Modal
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpPass, setNewEmpPass] = useState("");
  const [newEmpBio, setNewEmpBio] = useState("");
  const [newEmpRole, setNewEmpRole] = useState<"employee" | "admin">("employee");
  const [creatingEmp, setCreatingEmp] = useState(false);

  // New Category inline
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, authLoading, router]);

  // Load posts based on role
  const loadPosts = useCallback(async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("status", statusFilter);

      // If employee, query only their own posts
      if (user.role !== "admin") {
        params.set("author", user.id);
      }

      const res = await fetch(`/api/blogs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.blogs || []);
      }
    } catch {
      showNotification("Failed to load posts", "error");
    } finally {
      setPostsLoading(false);
    }
  }, [user, statusFilter]);

  // Load admin stats & employees
  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setEmployeesLoading(true);
    try {
      const [statsRes, empRes, catRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/employees"),
        fetch("/api/categories"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAdminStats(statsData);
      }
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch {
      showNotification("Error loading admin telemetry", "error");
    } finally {
      setEmployeesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPosts();
      if (user.role === "admin") {
        loadAdminData();
      }
    }
  }, [user, loadPosts, loadAdminData]);

  // Toggle publish / unpublish
  const handleToggleStatus = async (blog: { slug: string; status: string }) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/blogs/${blog.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showNotification(
          newStatus === "published" ? "Story published to live feed" : "Story moved to draft mode"
        );
        loadPosts();
        if (user?.role === "admin") loadAdminData();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to update status", "error");
      }
    } catch {
      showNotification("Network error updating story status", "error");
    }
  };

  // Delete blog
  const handleDeletePost = async (slug: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${slug}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Post deleted successfully");
        setPosts((prev) => prev.filter((p) => p.slug !== slug));
        if (user?.role === "admin") loadAdminData();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to delete post", "error");
      }
    } catch {
      showNotification("Network error deleting post", "error");
    }
  };

  // Create new Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail || !newEmpPass) return;

    setCreatingEmp(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmpName.trim(),
          email: newEmpEmail.trim(),
          password: newEmpPass,
          bio: newEmpBio.trim(),
          role: newEmpRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add employee");
      }

      showNotification("Employee account created successfully!");
      setIsAddEmployeeOpen(false);
      setNewEmpName("");
      setNewEmpEmail("");
      setNewEmpPass("");
      setNewEmpBio("");
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating employee";
      showNotification(message, "error");
    } finally {
      setCreatingEmp(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove employee "${name}"? All posts created by this employee will also be removed.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification(`Employee ${name} removed`);
        setEmployees((prev) => prev.filter((e) => e.id !== id && e._id !== id));
        loadAdminData();
        loadPosts();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to remove employee", "error");
      }
    } catch {
      showNotification("Network error deleting employee", "error");
    }
  };

  // Add Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCreatingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      showNotification("Category added successfully!");
      setNewCatName("");
      setNewCatDesc("");
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding category";
      showNotification(message, "error");
    } finally {
      setCreatingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Category deleted");
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }
    } catch {
      showNotification("Network error deleting category", "error");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Loading editorial control room...</p>
        </div>
      </div>
    );
  }

  // Filter posts by search input
  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.author?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-4 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header Profile & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              user.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
            }
            alt={user.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {user.name}
              </h1>
              <span
                className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  user.role === "admin"
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                }`}
              >
                {user.role} workspace
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {user.email} • {user.bio || "Staff Technical Author"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all"
          >
            <PenSquare className="w-4 h-4" />
            Write Story
          </Link>
        </div>
      </div>

      {/* Admin Stats Grid (Shown to Admin only) */}
      {user.role === "admin" && adminStats && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Platform Stories</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {adminStats.totalBlogs}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {adminStats.publishedBlogs} published
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {adminStats.draftBlogs} drafts
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Total Article Views</span>
              <Eye className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {adminStats.totalViews.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">Across all engineering topics</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Reader Likes</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {adminStats.totalLikes}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">Community appreciation signals</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Most Active Contributor</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            {adminStats.mostActiveEmployee ? (
              <div className="flex items-center gap-2.5 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    adminStats.mostActiveEmployee.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      adminStats.mostActiveEmployee.name
                    )}`
                  }
                  alt={adminStats.mostActiveEmployee.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {adminStats.mostActiveEmployee.name}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {adminStats.mostActiveEmployee.publishedCount} published stories
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">No contributor activity yet</p>
            )}
          </div>
        </div>
      )}

      {/* Employee Stats Grid (Shown to Employee) */}
      {user.role === "employee" && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>My Stories</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {posts.length}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {posts.filter((p) => p.status === "published").length} published
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {posts.filter((p) => p.status === "draft").length} drafts
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Total Article Reads</span>
              <Eye className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {posts.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">Views across your published articles</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Total Reader Likes</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">Reader appreciation signals</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Author Status</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-2">
              Active Author
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Authorized to publish stories
            </p>
          </div>
        </div>
      )}

      {/* Tabs Row for Admin, or Simple Title for Employee */}
      <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        {user.role === "admin" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "posts"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              Manage All Posts ({posts.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("employees")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "employees"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Users className="w-4 h-4" />
              Employees & Authors ({employees.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "categories"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Tag className="w-4 h-4" />
              Categories & Tags
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              My Authored Stories
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your draft and published engineering articles.
            </p>
          </div>
        )}

        {/* Filter Controls (for posts tab) */}
        {activeTab === "posts" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
              />
            </div>

            <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === "all" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("published")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === "published"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-600"
                    : "text-gray-500"
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === "draft"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-amber-600"
                    : "text-gray-500"
                }`}
              >
                Drafts
              </button>
            </div>
          </div>
        )}

        {/* Add Employee CTA if on employees tab */}
        {activeTab === "employees" && user.role === "admin" && (
          <button
            type="button"
            onClick={() => setIsAddEmployeeOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* TAB 1: POSTS TABLE */}
      {activeTab === "posts" && (
        <div className="mt-6">
          {postsLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">
              Loading editorial stories...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-6">
              <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No stories found
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                You haven&apos;t written any stories matching this filter yet.
              </p>
              <Link
                href="/editor"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Craft New Story
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-850 dark:bg-gray-800/50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">Title & Topic</th>
                    <th className="px-6 py-3.5">Author</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Performance</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <Link
                            href={
                              post.status === "published"
                                ? `/blog/${post.slug}`
                                : `/editor/${post.slug}`
                            }
                            className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {post.category}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              post.author?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                post.author?.name || "Author"
                              )}`
                            }
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {post.author?.name || "Author"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(post)}
                          title="Click to toggle Publish / Draft"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            post.status === "published"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:ring-2 hover:ring-emerald-500/20"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:ring-2 hover:ring-amber-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              post.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span className="capitalize">{post.status}</span>
                        </button>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            {post.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500/70" />
                            {post.likes?.length || 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.status === "published" && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="View Live Article"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}

                          <Link
                            href={`/editor/${post.slug}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit Story"
                          >
                            <PenSquare className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.slug, post.title)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete Story"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEES MANAGEMENT (Admin Only) */}
      {activeTab === "employees" && user.role === "admin" && (
        <div className="mt-6">
          {employeesLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading team members...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-6">
              <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No employees registered
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Add your internal team members to enable publishing.
              </p>
              <button
                type="button"
                onClick={() => setIsAddEmployeeOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Employee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-850 dark:bg-gray-800/50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Work Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Published Articles</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id || emp._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              emp.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                emp.name
                              )}`
                            }
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white leading-snug">
                              {emp.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate max-w-xs">
                              {emp.bio || "Engineering Contributor"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-300">
                        {emp.email}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {emp.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                          {emp.publishedPosts} stories
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(emp.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp.id || emp._id, emp.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remove Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT (Admin Only) */}
      {activeTab === "categories" && user.role === "admin" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Category Form */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Add Editorial Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Architecture"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this domain..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCat || !newCatName.trim()}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
              >
                {creatingCat ? "Saving Category..." : "Create Category"}
              </button>
            </form>
          </div>

          {/* Existing Categories List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Active Platform Categories ({categories.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-start justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {cat.description || "No description provided."}
                    </p>
                    <span className="inline-block mt-2 font-mono text-[10px] text-gray-400">
                      /categories/{cat.slug}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat._id, cat.name)}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL DIALOG */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Add New Employee
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEmployeeOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Company Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="david@analyticsliv.com"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newEmpPass}
                  onChange={(e) => setNewEmpPass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value as "employee" | "admin")}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="employee">Employee (Author & Publisher)</option>
                  <option value="admin">Admin (Full System Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bio / Specialization
                </label>
                <textarea
                  rows={2}
                  placeholder="Staff engineer, data scientist..."
                  value={newEmpBio}
                  onChange={(e) => setNewEmpBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEmp}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {creatingEmp ? "Adding Employee..." : "Create Employee Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
