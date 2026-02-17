import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { Role } from "@prisma/client"

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "RESPONSABLE", "AGENT", "ARCHIVISTE"]).optional(),
})

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json())
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }
    const hash = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hash,
        name: body.name ?? null,
        role: (body.role as Role) ?? "AGENT",
      },
    })
    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      { status: 201 }
    )
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
