import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    if (session.userId === id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    await connectDB();

    const employee = await User.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete employee and their blogs
    await Promise.all([
      User.findByIdAndDelete(id),
      Blog.deleteMany({ author: id }),
    ]);

    return NextResponse.json({ message: "Employee and associated posts removed successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
