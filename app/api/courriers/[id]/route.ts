import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role, Status } from "@prisma/client"
import { recordHistory } from "@/lib/history"

const updateSchema = z.object({
  subject: z.string().min(1).optional(),
  body: z.string().optional(),
  sender: z.string().optional(),
  recipient: z.string().optional(),
  status: z.enum(["RECEIVED", "IN_PROGRESS", "ASSIGNED", "DONE", "ARCHIVED"]).optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
      Role.ARCHIVISTE,
    ])
    const { id } = await params
    const courrier = await prisma.courrier.findUnique({
      where: { id },
      include: {
        attachments: true,
        history: { include: { actor: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    })
    if (!courrier) {
      return NextResponse.json({ error: "Courrier introuvable" }, { status: 404 })
    }
    return NextResponse.json(courrier)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(req, [Role.SUPER_ADMIN, Role.RESPONSABLE])
    const { id } = await params
    await prisma.courrier.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Courrier introuvable" }, { status: 404 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
      Role.ARCHIVISTE,
    ])
    const { id } = await params
    const courrier = await prisma.courrier.findUnique({ where: { id } })
    if (!courrier) {
      return NextResponse.json({ error: "Courrier introuvable" }, { status: 404 })
    }
    const body = updateSchema.parse(await req.json())
    const fromStatus = courrier.status
    const toStatus = body.status ?? fromStatus

    const updated = await prisma.courrier.update({
      where: { id },
      data: {
        ...(body.subject != null && { subject: body.subject }),
        ...(body.body != null && { body: body.body }),
        ...(body.sender != null && { sender: body.sender }),
        ...(body.recipient != null && { recipient: body.recipient }),
        ...(body.status != null && { status: body.status as Status }),
        ...(body.type != null && { type: body.type }),
        ...(body.category != null && { category: body.category }),
        ...(body.priority != null && { priority: body.priority }),
      },
      include: {
        attachments: true,
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    })

    if (toStatus !== fromStatus) {
      await recordHistory({
        courrierId: id,
        actorId: user.sub,
        action: "STATUS_CHANGE",
        fromStatus,
        toStatus: toStatus as Status,
        note: `État: ${fromStatus} → ${toStatus}`,
      })
    }
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
