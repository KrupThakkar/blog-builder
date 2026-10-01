# AnalyticsLiv — Blog Builder Platform

A full-stack internal content management and publishing platform built with Next.js, MongoDB, and Tailwind CSS.

---

## 🛠️ Tech Stack & Why

| Technology | Role | Why Used |
| :--- | :--- | :--- |
| **Next.js 16 (App Router)** | Full-Stack Framework | Combines React Server Components, fast streaming, and built-in API Route Handlers in a single repository without needing a separate backend server. |
| **TypeScript** | Programming Language | Ensures end-to-end type safety across database models, API handlers, and UI components. |
| **MongoDB & Mongoose** | Database & ODM | Flexible document store well-suited for blog posts (rich HTML content, tags, author references, likes arrays, and comments). |
| **TipTap** | Rich Text Editor | Robust headless WYSIWYG editor based on ProseMirror; supports headings, formatting, links, code blocks, and images cleanly without browser `contenteditable` bugs. |
| **Tailwind CSS v4** | Styling | Fast utility-first styling with responsive layouts, typography, and dark mode support. |
| **JWT & bcryptjs** | Authentication & Security | Stateless session tokens stored in HTTP-only cookies paired with salted bcrypt hashing for passwords. |
| **Cloudinary** | Media Storage | Cloud CDN image uploads for blog covers with automated fallback to local `/public/uploads/` storage. |

---

## 🚀 Setup & Installation Steps

### 1. Prerequisites
- **Node.js**: v18.17.0+
- **MongoDB**: Local instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas cloud URI

### 2. Clone & Install
```bash
git clone https://github.com/KrupThakkar/blog-builder.git
cd blog-builder
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory (refer to `.env.example`):
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudinary (Optional - falls back to local storage if omitted)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run the Application
```bash
# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Production build
npm run build
npm start
```

---

## ✅ Features Implemented vs. Skipped

### Fully Implemented
- **Role-Based Access Control (RBAC):** Distinct `admin` and `employee` roles. Admins can view/edit/delete all blogs, manage categories, manage employees, and view platform metrics. Employees can only manage their own posts.
- **TipTap WYSIWYG Editor:** Headings (H1/H2/H3), bold, italic, lists, blockquotes, code blocks, hyperlinks, image insertion, undo/redo, auto-slug generation, reading time estimation, and draft auto-saving.
- **Public Blog Feed:** Homepage with hero story, live search by keyword, category pill filtering, sorting (Latest, Most Views, Most Liked), and pagination.
- **Blog Detail Page:** Responsive reading layout, author info, view counter, interactive likes with confetti animation, and comments section.
- **Media Uploads:** Cloudinary CDN integration with 10MB size limits and file format validation (JPEG, PNG, WEBP, GIF, SVG), plus local filesystem fallback.
- **Dark Mode:** System-aware theme toggle with `localStorage` persistence.
- **Admin Dashboard:** Aggregated metrics (total views, likes, published articles) and employee management.

### Skipped / Deferred
- **Email Verification & Password Reset:** Skipped to keep authentication straightforward; accounts are active immediately upon registration.
- **Real-Time Collaborative Editing:** Multiple authors editing the same draft simultaneously is not implemented (single author per post model).
- **Social OAuth Login:** Google/GitHub third-party sign-in was deferred in favor of direct email/password JWT authentication.

---

## ⚠️ Known Limitations

1. **Local Uploads Ephemerality (without Cloudinary):** If Cloudinary environment keys are not configured, images fall back to the local `/public/uploads/` directory. On serverless cloud hosting (like Vercel), local disk writes are ephemeral and will reset when containers restart.
2. **Draft Auto-Save Sync:** Auto-saves are saved to browser `localStorage` and synchronized to the database upon clicking "Save Draft" or "Publish", rather than live background WebSocket streaming.
3. **Comment Moderation:** Comments post immediately to the article without an admin approval queue.
