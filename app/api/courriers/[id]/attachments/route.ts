import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Role } from "@prisma/client"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const MAX_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE ?? "10485760", 10) // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200)
}

export async function POST(
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
    const courrier = await prisma.courrier.findUnique({ where: { id } })
    if (!courrier) {
      return NextResponse.json({ error: "Courrier introuvable" }, { status: 404 })
    }
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier fourni (attendez 'file')" },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_SIZE / 1024 / 1024} MB)` },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|gif|doc|docx)$/i)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé (PDF, images, Word)" },
        { status: 400 }
      )
    }
    await mkdir(UPLOAD_DIR, { recursive: true })
    const ext = path.extname(file.name) || path.extname(file.name.toLowerCase()) || ".bin"
    const safeName = sanitizeFilename(path.basename(file.name, path.extname(file.name)))
    const filename = `${safeName}-${randomUUID()}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))
    const url = `/uploads/${filename}`
    const attachment = await prisma.attachment.create({
      data: {
        courrierId: id,
        filename: file.name,
        url,
      },
    })
    return NextResponse.json(attachment, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur"
    if (msg === "Not authenticated")
      return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden")
      return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
