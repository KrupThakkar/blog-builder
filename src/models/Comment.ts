import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  blog: mongoose.Types.ObjectId;
  authorName: string;
  authorEmail?: string;
  user?: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: [true, "Your name is required"],
      trim: true,
      maxlength: 100,
    },
    authorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    content: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
