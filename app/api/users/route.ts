import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    requireRole(req, [Role.SUPER_ADMIN, Role.RESPONSABLE])
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, entityId: true, isActive: true, createdAt: true },
      orderBy: { email: "asc" },
    })
    return NextResponse.json(users)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
