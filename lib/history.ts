import prisma from "@/lib/prisma"
import { Status } from "@prisma/client"

export async function recordHistory(params: {
  courrierId: string
  actorId: string
  action: string
  fromStatus?: Status | null
  toStatus?: Status | null
  note?: string | null
}) {
  await prisma.history.create({
    data: {
      courrierId: params.courrierId,
      actorId: params.actorId,
      action: params.action,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus ?? undefined,
      note: params.note ?? undefined,
    },
  })
}
