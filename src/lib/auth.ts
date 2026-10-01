import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { UserRole } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "analyticsliv_super_jwt_secret_dev_key";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): TokenPayload | null {
  // Check cookie first
  const tokenFromCookie = request.cookies.get("token")?.value;
  if (tokenFromCookie) {
    const payload = verifyToken(tokenFromCookie);
    if (payload) return payload;
  }

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    return verifyToken(token);
  }

  return null;
}
