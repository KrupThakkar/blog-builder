import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();

    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalEmployees,
      viewsAndLikesAgg,
      authorAgg,
      categoryAgg,
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "draft" }),
      User.countDocuments({ role: "employee" }),
      Blog.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
            totalLikes: { $sum: { $size: "$likes" } },
          },
        },
      ]),
      Blog.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$author", count: { $sum: 1 }, totalViews: { $sum: "$views" } } },
        { $sort: { count: -1, totalViews: -1 } },
        { $limit: 1 },
      ]),
      Blog.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalViews = viewsAndLikesAgg[0]?.totalViews || 0;
    const totalLikes = viewsAndLikesAgg[0]?.totalLikes || 0;

    let mostActiveEmployee = null;
    if (authorAgg.length > 0) {
      const topAuthor = await User.findById(authorAgg[0]._id).select("name email avatar").lean();
      if (topAuthor) {
        mostActiveEmployee = {
          name: topAuthor.name,
          email: topAuthor.email,
          avatar: topAuthor.avatar,
          publishedCount: authorAgg[0].count,
          totalViews: authorAgg[0].totalViews,
        };
      }
    }

    return NextResponse.json({
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalEmployees,
      totalViews,
      totalLikes,
      mostActiveEmployee,
      categoryBreakdown: categoryAgg.map((item) => ({
        category: item._id || "Uncategorized",
        count: item.count,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
