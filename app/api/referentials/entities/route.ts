import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    requireRole(req, [Role.SUPER_ADMIN, Role.RESPONSABLE, Role.AGENT, Role.ARCHIVISTE])
    const list = await prisma.entity.findMany({ orderBy: { label: "asc" } })
    return NextResponse.json(list)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
