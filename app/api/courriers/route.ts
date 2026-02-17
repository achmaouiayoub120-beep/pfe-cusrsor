import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role, Status } from "@prisma/client"
import { recordHistory } from "@/lib/history"

const createSchema = z.object({
  reference: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().optional(),
  sender: z.string().optional(),
  recipient: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  toEntity: z.string().optional(),
  fromEntity: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
      Role.ARCHIVISTE,
    ])
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
    const q = searchParams.get("q") ?? ""
    const status = searchParams.get("status") ?? ""

    const where: Parameters<typeof prisma.courrier.findMany>[0]["where"] = {}
    if (q) {
      where.OR = [
        { reference: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ]
    }
    if (status && Object.values(Status).includes(status as Status)) {
      where.status = status as Status
    }

    const [items, total] = await Promise.all([
      prisma.courrier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attachments: true,
          assignedUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.courrier.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
    ])
    const body = createSchema.parse(await req.json())
    const existing = await prisma.courrier.findUnique({
      where: { reference: body.reference },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Une référence identique existe déjà" },
        { status: 400 }
      )
    }
    const courrier = await prisma.courrier.create({
      data: {
        reference: body.reference,
        subject: body.subject,
        body: body.body ?? null,
        sender: body.sender ?? null,
        recipient: body.recipient ?? null,
        type: body.type ?? null,
        category: body.category ?? null,
        priority: body.priority ?? "normal",
        toEntity: body.toEntity ?? null,
        fromEntity: body.fromEntity ?? null,
        createdBy: user.sub,
        status: "RECEIVED",
      },
    })
    await recordHistory({
      courrierId: courrier.id,
      actorId: user.sub,
      action: "CREATED",
      toStatus: "RECEIVED",
      note: "Courrier créé",
    })
    const created = await prisma.courrier.findUnique({
      where: { id: courrier.id },
      include: {
        attachments: true,
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    })
    return NextResponse.json(created, { status: 201 })
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
