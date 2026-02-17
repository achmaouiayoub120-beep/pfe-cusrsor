import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role, Status } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
      Role.ARCHIVISTE,
    ])
    const [totalCourriers, byStatus, courriers] = await Promise.all([
      prisma.courrier.count(),
      prisma.courrier.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.courrier.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      }),
    ])
    const byStatusMap: Record<string, number> = {}
    Object.values(Status).forEach((s) => {
      byStatusMap[s] = 0
    })
    byStatus.forEach((r) => {
      byStatusMap[r.status] = r._count.status
    })
    const result = {
      totalCourriers,
      byStatus: byStatusMap,
      recentCourriers: courriers,
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
