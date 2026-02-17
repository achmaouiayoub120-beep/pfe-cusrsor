import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { Role } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production"
const COOKIE_NAME = "token"

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: "7d", subject: payload.sub }
  )
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(COOKIE_NAME)?.value
}

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(req)
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(req: NextRequest): JwtPayload {
  const user = getUserFromRequest(req)
  if (!user) throw new Error("Not authenticated")
  return user
}

export function requireRole(req: NextRequest, allowedRoles: Role[]): JwtPayload {
  const user = requireAuth(req)
  if (!allowedRoles.includes(user.role)) throw new Error("Forbidden")
  return user
}

export function getCookieConfig() {
  const isProd = process.env.NODE_ENV === "production"
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  }
}

export { COOKIE_NAME }
