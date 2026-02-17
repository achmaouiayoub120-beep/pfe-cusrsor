import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    requireRole(req, [
      Role.SUPER_ADMIN,
      Role.RESPONSABLE,
      Role.AGENT,
      Role.ARCHIVISTE,
    ])
    const type = req.nextUrl.searchParams.get("type") ?? "csv"
    const courriers = await prisma.courrier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedUser: { select: { name: true, email: true } },
      },
    })
    if (type === "csv") {
      const header = [
        "Référence",
        "Sujet",
        "Type",
        "Catégorie",
        "État",
        "Priorité",
        "Destination",
        "Assigné à",
        "Date création",
      ]
      const rows = courriers.map((c) => [
        c.reference,
        c.subject,
        c.type ?? "",
        c.category ?? "",
        c.status,
        c.priority ?? "",
        c.recipient ?? c.toEntity ?? "",
        c.assignedUser?.name ?? c.assignedUser?.email ?? "",
        new Date(c.createdAt).toLocaleDateString(),
      ])
      const csv =
        header.join(",") +
        "\n" +
        rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="courriers_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }
    return NextResponse.json({ error: "type non supporté (csv)" }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
