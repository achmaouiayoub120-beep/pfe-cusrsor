import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { signToken, getCookieConfig, COOKIE_NAME } from "@/lib/auth"

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json())
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }
    const ok = await bcrypt.compare(body.password, user.password)
    if (!ok) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
    res.cookies.set(COOKIE_NAME, token, getCookieConfig())
    return res
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: e.flatten() },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
