export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
}

export function calculateReadTime(content: string): number {
  const plainText = stripHtml(content);
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
