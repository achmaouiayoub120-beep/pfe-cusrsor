"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiCourrierById, apiUpdateCourrier, apiUploadAttachment, apiReferentialsEntities, apiUsers } from "@/lib/api"
import type { Courier } from "@/lib/types"
import { ApiStatus } from "@/lib/types"
import { Download, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CourrierDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [courrier, setCourrier] = useState<Courier | null>(null)
  const [entities, setEntities] = useState<{ id: string; label: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    apiCourrierById(id).then((c) => setCourrier(c ?? null)).catch(() => setCourrier(null))
    apiReferentialsEntities().then(setEntities).catch(() => [])
    apiUsers().then(setUsers).catch(() => [])
  }, [id])

  const handleStateChange = async (newStatus: string) => {
    if (!courrier) return
    setIsUpdating(true)
    try {
      const updated = await apiUpdateCourrier(id, { status: newStatus })
      setCourrier(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !courrier) return
    setUploading(true)
    try {
      const att = await apiUploadAttachment(courrier.id, file)
      setCourrier((prev) =>
        prev ? { ...prev, attachments: [...prev.attachments, { ...att, name: att.filename, uploadedAt: new Date().toISOString() }] } : null
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur upload")
    } finally {
      setUploading(false)
    }
  }

  const getEntityLabel = (entityId?: string | null) => {
    if (!entityId) return "Non assigné"
    return entities.find((e) => e.id === entityId)?.label ?? entityId
  }

  const getStateColor = (status: string) => {
    switch (status) {
      case ApiStatus.RECEIVED:
        return "bg-blue-100 text-blue-800"
      case ApiStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800"
      case ApiStatus.DONE:
        return "bg-green-100 text-green-800"
      case ApiStatus.ARCHIVED:
        return "bg-gray-100 text-gray-800"
      case ApiStatus.ASSIGNED:
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!courrier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement ou courrier non trouvé</p>
      </div>
    )
  }

  const displayAttachments = courrier.attachments ?? []

  return (
    <div className="space-y-6 p-6">
      <Link href="/courriers">
        <Button variant="outline" className="gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{courrier.subject}</h1>
        <p className="text-muted-foreground">Référence: {courrier.reference}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Type</label>
                  <p className="text-sm font-medium">{courrier.type ?? "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Catégorie</label>
                  <p className="text-sm font-medium">{courrier.category ?? "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Priorité</label>
                  <p className="text-sm font-medium">{courrier.priority ?? "normal"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Destination</label>
                  <p className="text-sm font-medium">{getEntityLabel(courrier.toEntity)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <p className="text-sm mt-2">{courrier.body ?? courrier.description ?? "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pièces Jointes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <label className="cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-sm">Ajouter un fichier</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {displayAttachments.length > 0 && (
                <div className="space-y-2">
                  {displayAttachments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{a.filename ?? a.name ?? a.url}</p>
                      <a href={a.url} download target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(courrier.history ?? []).map((entry, index) => (
                  <div key={entry.id ?? index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`px-3 py-1 rounded text-xs font-medium ${getStateColor(entry.toStatus ?? entry.state ?? "")}`}>
                      {entry.action} {entry.toStatus ?? entry.state ?? ""}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.changedAt ?? entry.createdAt ?? "").toLocaleString()}
                        {entry.actor?.name && ` — ${entry.actor.name}`}
                      </p>
                      {(entry.note ?? entry.notes) && <p className="text-sm mt-1">{entry.note ?? entry.notes}</p>}
                    </div>
                  </div>
                ))}
                {(!courrier.history || courrier.history.length === 0) && (
                  <p className="text-sm text-muted-foreground">Aucun historique</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>État du Courrier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStateColor(courrier.status)}`}>
                {courrier.status}
              </span>
              <div>
                <label className="text-sm font-medium">Changer l&apos;état</label>
                <Select value={courrier.status} onValueChange={handleStateChange} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ApiStatus).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Créé par</label>
                <p>{users.find((u) => u.id === courrier.createdBy)?.name ?? courrier.createdBy ?? "Inconnu"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Date de création</label>
                <p>{new Date(courrier.createdAt).toLocaleDateString()}</p>
              </div>
              {courrier.assignedUser && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Assigné à</label>
                  <p>{courrier.assignedUser.name ?? courrier.assignedUser.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
