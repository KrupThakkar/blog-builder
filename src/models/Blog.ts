import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./User";

export type BlogStatus = "draft" | "published";

export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: mongoose.Types.ObjectId | IUser;
  status: BlogStatus;
  readTime: number;
  views: number;
  likes: string[];
  likesCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 250,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      default: "",
      maxlength: 500,
    },
    coverImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    readTime: {
      type: Number,
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: [String],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-set publishedAt and likesCount
BlogSchema.pre("save", function () {
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (this.likes) {
    this.likesCount = this.likes.length;
  }
});

export const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
