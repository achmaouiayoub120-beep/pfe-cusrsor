"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiReferentialsStates } from "@/lib/api"
import { ArrowLeft } from "lucide-react"

export default function StatesPage() {
  const router = useRouter()
  const [states, setStates] = useState<{ id: string; label: string; description?: string; color?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiReferentialsStates()
      .then(setStates)
      .catch(() => setStates([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-transparent w-fit mb-4">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>
      <div>
        <h1 className="text-3xl font-bold">États de référence</h1>
        <p className="text-muted-foreground">Liste des états (lecture seule via API)</p>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste ({states.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Libellé</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">Couleur</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{s.label}</td>
                      <td className="py-3 px-4">{s.description ?? "-"}</td>
                      <td className="py-3 px-4">
                        {s.color && (
                          <span className="inline-block w-6 h-6 rounded border" style={{ backgroundColor: s.color }} />
                        )}
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
