import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Auth check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
