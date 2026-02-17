import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role } from "@prisma/client"
import { recordHistory } from "@/lib/history"

const bodySchema = z.object({ userId: z.string().uuid() })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
    ])
    const { id } = await params
    const body = bodySchema.parse(await req.json())
    const courrier = await prisma.courrier.findUnique({ where: { id } })
    if (!courrier) {
      return NextResponse.json({ error: "Courrier introuvable" }, { status: 404 })
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    })
    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }
    const previousAssigned = courrier.assignedTo
    const updated = await prisma.courrier.update({
      where: { id },
      data: { assignedTo: body.userId },
      include: {
        attachments: true,
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    })
    await recordHistory({
      courrierId: id,
      actorId: user.sub,
      action: "ASSIGNED",
      note: `Assigné à ${targetUser.name ?? targetUser.email} (${previousAssigned ?? "aucun"} → ${body.userId})`,
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: e.flatten() },
        { status: 400 }
      )
    }
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
