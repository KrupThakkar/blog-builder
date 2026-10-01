"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  Undo,
  Redo,
  UploadCloud,
  CheckCircle2,
  Eye,
  Send,
  Save,
  Clock,
  Sparkles,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { calculateReadTime, slugify } from "@/lib/utils";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

interface BlogEditorProps {
  initialData?: {
    _id?: string;
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
    category?: string;
    tags?: string[];
    status?: "draft" | "published";
  };
  isEditing?: boolean;
}

const PRESET_COVERS = [
  {
    name: "Data Analytics & Charts",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
  },
  {
    name: "Developer Workspace & Code",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80",
  },
  {
    name: "Minimalist Productivity Desk",
    url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&auto=format&fit=crop&q=80",
  },
  {
    name: "Cloud Architecture & AI",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
  },
];

export function BlogEditor({ initialData, isEditing = false }: BlogEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [category, setCategory] = useState(initialData?.category || "Data & Analytics");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "draft");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-600 dark:text-indigo-400 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: "Write your story here... Share deep technical insights, code snippets, or architecture decisions.",
      }),
    ],
    content: initialData?.content || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-[400px] px-6 py-6 text-gray-800 dark:text-gray-200",
      },
    },
    onUpdate: () => {
      setAutoSaveStatus("unsaved");
      triggerDebouncedAutoSave();
    },
  });

  // Load existing categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          if (!category && data.categories?.length > 0) {
            setCategory(data.categories[0].name);
          }
        }
      } catch {
        // fallback
      }
    }
    fetchCategories();
  }, [category]);

  // Auto-generate slug when title changes (unless user manually customized slug)
  useEffect(() => {
    if (!isSlugCustom && !isEditing) {
      setSlug(slugify(title));
    }
  }, [title, isSlugCustom, isEditing]);

  // Auto-save logic
  const triggerDebouncedAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus("saving");
      // Save draft to localStorage for client-side crash recovery
      try {
        if (title.trim() || editor?.getHTML()) {
          localStorage.setItem(
            "blog_builder_draft",
            JSON.stringify({
              title,
              slug,
              excerpt,
              category,
              tags,
              content: editor?.getHTML(),
              coverImage,
              updatedAt: new Date().toISOString(),
            })
          );
        }
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("unsaved");
      }
    }, 1500);
  }, [title, slug, excerpt, category, tags, editor, coverImage]);

  // Handle Tag Input
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setCoverImage(data.url);
      setSuccessMsg("Cover image uploaded successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error uploading file";
      setErrorMsg(message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Insert image inside editor
  const handleInsertEditorImage = () => {
    const url = window.prompt("Enter image URL to insert in article:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Set link in editor
  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter hyperlink URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Form submit handler
  const handleSave = async (targetStatus: "draft" | "published") => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("Please provide a title for your blog post.");
      return;
    }

    const contentHtml = editor?.getHTML() || "";
    if (!contentHtml || contentHtml === "<p></p>") {
      setErrorMsg("Please write some content for your story.");
      return;
    }

    if (!category) {
      setErrorMsg("Please select a category.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        content: contentHtml,
        excerpt: excerpt.trim(),
        coverImage,
        category,
        tags,
        status: targetStatus,
        customSlug: slug,
        newSlug: isEditing ? slug : undefined,
      };

      const url = isEditing && initialData?.slug
        ? `/api/blogs/${initialData.slug}`
        : "/api/blogs";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save blog post");
      }

      // Clear local storage draft
      localStorage.removeItem("blog_builder_draft");

      if (targetStatus === "published") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setSuccessMsg(
        targetStatus === "published"
          ? "🎉 Story published successfully!"
          : "Draft saved successfully!"
      );

      setTimeout(() => {
        if (targetStatus === "published") {
          router.push(`/blog/${data.slug}`);
        } else {
          router.push("/dashboard");
        }
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving post";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentReadTime = editor ? calculateReadTime(editor.getHTML()) : 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? "Edit Story" : "Craft a New Story"}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {currentReadTime} min read
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {autoSaveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Auto-saved
                  </>
                )}
                {autoSaveStatus === "saving" && "Saving draft..."}
                {autoSaveStatus === "unsaved" && "Unsaved changes"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? "Return to Editor" : "Live Preview"}
          </button>

          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Preview Mode */}
      {previewMode ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mb-4">
              {category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
              {title || "Untitled Story"}
            </h1>
            {excerpt && (
              <p className="text-lg text-gray-600 dark:text-gray-300 italic mb-6">
                {excerpt}
              </p>
            )}
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt="Cover Preview"
                className="w-full max-h-[420px] object-cover rounded-2xl mb-8"
              />
            )}
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
            />
          </div>
        </div>
      ) : (
        /* Main Editor Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                placeholder="Story Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white bg-transparent border-0 border-b border-gray-200 dark:border-gray-800 pb-3 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors"
              />
            </div>

            {/* Slug Configuration */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="font-semibold text-gray-700 dark:text-gray-300">URL Slug:</span>
              <span className="text-gray-400">/blog/</span>
              {isSlugCustom ? (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-indigo-600 dark:text-indigo-400 focus:outline-none"
                />
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {slug || "auto-generated-from-title"}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsSlugCustom(!isSlugCustom)}
                className="ml-auto text-indigo-600 hover:underline dark:text-indigo-400 font-medium"
              >
                {isSlugCustom ? "Done" : "Customize"}
              </button>
            </div>

            {/* TipTap Toolbar & Editor Frame */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/80 dark:bg-gray-850 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("bold")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("italic")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("strike")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("heading", { level: 1 })
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("heading", { level: 3 })
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("bulletList")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("orderedList")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("blockquote")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("codeBlock")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Code Block"
                >
                  <Code className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

                <button
                  type="button"
                  onClick={handleSetLink}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editor?.isActive("link")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Hyperlink"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleInsertEditorImage}
                  className="p-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Insert Inline Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                  className="p-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Horizontal Divider"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editor?.can().undo()}
                    className="p-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editor?.can().redo()}
                    className="p-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                    title="Redo"
                  >
                    <Redo className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor Content Area */}
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Sidebar Settings (1 Col) */}
          <div className="space-y-6">
            {/* Publishing Details Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Post Settings
              </h3>

              {/* Status Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Publishing Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      status === "draft"
                        ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20"
                        : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    Draft Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("published")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      status === "published"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                        : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <option value="Data & Analytics">Data & Analytics</option>
                      <option value="Careers & Tech">Careers & Tech</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Engineering">Engineering</option>
                    </>
                  )}
                </select>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tags (Press Enter to add)
                </label>
                <input
                  type="text"
                  placeholder="e.g. analytics, nextjs, react..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-gray-400"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Excerpt / Summary */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Summary / Excerpt (SEO & Card Preview)
                </label>
                <textarea
                  rows={3}
                  placeholder="A concise summary of the article that appears in preview cards..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Cover Image Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center justify-between">
                <span>Cover Image</span>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="text-xs text-red-500 hover:underline font-normal"
                  >
                    Remove
                  </button>
                )}
              </h3>

              {coverImage ? (
                <div className="relative rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-800 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-gray-900 text-xs font-bold shadow hover:bg-white"
                    >
                      Change Cover
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-850 dark:bg-gray-800/20"
                >
                  <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {uploadingImage ? "Uploading file..." : "Upload Cover Image"}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, or WEBP up to 5MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {/* Or Select from curated Presets */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Or Pick Curated Tech Presets
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCoverImage(preset.url)}
                      className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] font-medium text-white truncate block text-left">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
