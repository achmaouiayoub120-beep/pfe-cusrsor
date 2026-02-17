"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiReferentialsTypes } from "@/lib/api"
import { ArrowLeft } from "lucide-react"

export default function TypesPage() {
  const router = useRouter()
  const [types, setTypes] = useState<{ id: string; label: string; description?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiReferentialsTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-transparent w-fit mb-4">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Types de Courrier</h1>
        <p className="text-muted-foreground">Liste des types (lecture seule via API)</p>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste ({types.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Libellé</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{t.label}</td>
                      <td className="py-3 px-4">{t.description ?? "-"}</td>
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
