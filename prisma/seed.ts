import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash("Password123!", 12)
  await prisma.user.upsert({
    where: { email: "admin@estsb.edu" },
    update: {},
    create: {
      email: "admin@estsb.edu",
      name: "Admin EST SB",
      password: hash,
      role: Role.SUPER_ADMIN,
    },
  })
  await prisma.user.upsert({
    where: { email: "agent@test.local" },
    update: {},
    create: {
      email: "agent@test.local",
      name: "Agent Test",
      password: hash,
      role: Role.AGENT,
    },
  })
  const entityCount = await prisma.entity.count()
  if (entityCount === 0) {
    await prisma.entity.createMany({
      data: [
        { label: "Informatique", description: "Department of Computer Science", code: "INFO", email: "info@estsb.edu", phone: "+212 5XX XXX XXX" },
        { label: "Génie Mécanique", description: "Department of Mechanical Engineering", code: "MECH", email: "mechanic@estsb.edu", phone: "+212 5XX XXX XXX" },
        { label: "Administration", description: "Administrative Department", code: "ADM", email: "admin@estsb.edu", phone: "+212 5XX XXX XXX" },
      ],
    })
  }
  const typeCount = await prisma.courierType.count()
  if (typeCount === 0) {
    await prisma.courierType.createMany({
      data: [
        { id: "1", label: "Entrant", description: "Incoming mail" },
        { id: "2", label: "Sortant", description: "Outgoing mail" },
        { id: "3", label: "Interne", description: "Internal mail" },
      ],
    })
  }
  const catCount = await prisma.category.count()
  if (catCount === 0) {
    await prisma.category.createMany({
      data: [
        { id: "1", label: "Réclamation", description: "Complaints" },
        { id: "2", label: "Incident", description: "Incidents" },
        { id: "3", label: "Demande", description: "Requests" },
        { id: "4", label: "Administration", description: "Administrative" },
        { id: "5", label: "Convocation", description: "Summons" },
        { id: "6", label: "Autre", description: "Other" },
      ],
    })
  }
  const stateCount = await prisma.refState.count()
  if (stateCount === 0) {
    await prisma.refState.createMany({
      data: [
        { id: "1", label: "Nouveau", description: "New", color: "#3B82F6" },
        { id: "2", label: "En cours", description: "In progress", color: "#F59E0B" },
        { id: "3", label: "Traité", description: "Done", color: "#10B981" },
        { id: "4", label: "Rejeté", description: "Rejected", color: "#EF4444" },
        { id: "5", label: "Archivé", description: "Archived", color: "#6B7280" },
      ],
    })
  }
  console.log("Seed done.")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
