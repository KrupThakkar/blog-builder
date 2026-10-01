import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();

    const employees = await User.find({ role: "employee" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate blog count for each employee
    const employeesWithCounts = await Promise.all(
      employees.map(async (emp) => {
        const [totalPosts, publishedPosts] = await Promise.all([
          Blog.countDocuments({ author: emp._id }),
          Blog.countDocuments({ author: emp._id, status: "published" }),
        ]);
        return {
          ...emp,
          id: emp._id.toString(),
          totalPosts,
          publishedPosts,
        };
      })
    );

    return NextResponse.json({ employees: employeesWithCounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load employees";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, bio, role = "employee" } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and temporary password are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const employee = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === "admin" ? "admin" : "employee",
      bio: bio || "",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    return NextResponse.json(
      {
        message: "Employee account created successfully",
        employee: {
          id: employee._id.toString(),
          name: employee.name,
          email: employee.email,
          role: employee.role,
          bio: employee.bio,
          avatar: employee.avatar,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
