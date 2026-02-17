"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiUsers, apiReferentialsEntities } from "@/lib/api"
import type { User } from "@/lib/types"
import { Role } from "@/lib/types"
import { ArrowLeft } from "lucide-react"

const roleLabels: Record<string, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.RESPONSABLE]: "Responsable",
  [Role.AGENT]: "Agent",
  [Role.ARCHIVISTE]: "Archiviste",
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [entities, setEntities] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([apiUsers(), apiReferentialsEntities()])
      .then(([u, e]) => {
        setUsers(u)
        setEntities(e)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-transparent w-fit mb-4">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground">Liste des utilisateurs (création via inscription ou API)</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Nom</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Rôle</th>
                    <th className="text-left py-3 px-4 font-semibold">Entité</th>
                    <th className="text-left py-3 px-4 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{user.name ?? "-"}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {roleLabels[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.entityId ? entities.find((e) => e.id === user.entityId)?.label ?? "-" : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
