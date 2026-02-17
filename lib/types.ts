// Type definitions for the mail management system

export interface User {
  id: string
  email: string
  name: string | null
  role: Role
  entityId?: string | null
  createdAt?: Date
  isActive?: boolean
}

// Rôles API (RBAC) — alignés avec Prisma
export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  RESPONSABLE: "RESPONSABLE",
  AGENT: "AGENT",
  ARCHIVISTE: "ARCHIVISTE",
} as const
export type Role = (typeof Role)[keyof typeof Role]

export interface Entity {
  id: string
  label: string
  description: string
  parentEntityId?: string
  chefId?: string
  email?: string
  phone?: string
  code?: string
  createdAt: Date
}

export interface Courier {
  id: string
  reference: string
  fromEntity?: string | null
  toEntity?: string | null
  type?: string | null
  category?: string | null
  status: ApiStatus
  subject: string
  body?: string | null
  description?: string
  priority: string
  createdBy?: string | null
  createdAt: string
  attachments: Attachment[]
  assignedTo?: string | null
  assignedUser?: { id: string; name: string | null; email: string } | null
  history: StateHistory[]
}

// États API (workflow courrier)
export const ApiStatus = {
  RECEIVED: "RECEIVED",
  IN_PROGRESS: "IN_PROGRESS",
  ASSIGNED: "ASSIGNED",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
} as const
export type ApiStatus = (typeof ApiStatus)[keyof typeof ApiStatus]

export enum CourierState {
  NEW = "RECEIVED",
  IN_PROGRESS = "IN_PROGRESS",
  TREATED = "DONE",
  REJECTED = "REJECTED",
  ARCHIVED = "ARCHIVED",
}

export enum Priority {
  NORMAL = "normal",
  URGENT = "urgent",
  VERY_URGENT = "very_urgent",
}

export interface Attachment {
  id: string
  filename: string
  name?: string
  type?: string
  size?: number
  url: string
  uploadedAt: string
}

export interface StateHistory {
  id?: string
  state?: string
  toStatus?: string
  action: string
  actorId?: string
  actor?: { id: string; name: string | null; email: string }
  changedBy?: string
  changedAt: string
  createdAt?: string
  note?: string | null
  notes?: string
}

export interface Category {
  id: string
  label: string
  description: string
}

export interface RefState {
  id: string
  label: string
  description: string
  color?: string
}

export interface DashboardStats {
  totalCourriers: number
  couriersByState: Record<CourierState, number>
  couriersByType: Record<string, number> // Changed from CourierType to string to avoid redeclaration
  couriersByCategory: Record<string, number>
  couriersByPriority: Record<Priority, number>
  monthlyTrend: Array<{ month: string; count: number }>
}

export interface CourierType {
  id: string
  label: string
  description: string
}
