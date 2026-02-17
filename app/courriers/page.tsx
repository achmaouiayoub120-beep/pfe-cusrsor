"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  apiCourriers,
  apiReferentialsEntities,
  apiReferentialsTypes,
  apiReferentialsCategories,
  apiDeleteCourrier,
  apiExportCSV,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Courier } from "@/lib/types"
import { ApiStatus, Role } from "@/lib/types"
import { Plus, Eye, Edit2, Trash2, Download, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CourriersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [courriers, setCourriers] = useState<Courier[]>([])
  const [filteredCourriers, setFilteredCourriers] = useState<Courier[]>([])
  const [search, setSearch] = useState("")
  const [filterState, setFilterState] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterEntity, setFilterEntity] = useState("all")
  const [sortBy, setSortBy] = useState("date_desc")
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<{ id: string; label: string }[]>([])
  const [types, setTypes] = useState<{ id: string; label: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [courriersRes, entitiesRes, typesRes, categoriesRes] = await Promise.all([
          apiCourriers({ limit: 500 }),
          apiReferentialsEntities(),
          apiReferentialsTypes(),
          apiReferentialsCategories(),
        ])
        if (cancelled) return
        setCourriers(courriersRes.data ?? [])
        setEntities(entitiesRes)
        setTypes(typesRes)
        setCategories(categoriesRes)
      } catch (e) {
        console.error(e)
        setCourriers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let filtered = courriers
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.reference.toLowerCase().includes(search.toLowerCase()) ||
          c.subject.toLowerCase().includes(search.toLowerCase()) ||
          (c.body ?? "").toLowerCase().includes(search.toLowerCase())
      )
    }
    if (filterState !== "all") filtered = filtered.filter((c) => c.status === filterState)
    if (filterType !== "all") filtered = filtered.filter((c) => c.type === filterType)
    if (filterCategory !== "all") filtered = filtered.filter((c) => c.category === filterCategory)
    if (filterPriority !== "all") filtered = filtered.filter((c) => (c.priority ?? "") === filterPriority)
    if (filterEntity !== "all") filtered = filtered.filter((c) => c.toEntity === filterEntity)
    switch (sortBy) {
      case "date_asc":
        filtered = [...filtered].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        break
      case "date_desc":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case "priority":
        const order: Record<string, number> = { very_urgent: 0, urgent: 1, normal: 2 }
        filtered = [...filtered].sort(
          (a, b) =>
            (order[(a.priority as string) ?? "normal"] ?? 3) -
            (order[(b.priority as string) ?? "normal"] ?? 3)
        )
        break
    }
    setFilteredCourriers(filtered)
  }, [courriers, search, filterState, filterType, filterCategory, filterPriority, filterEntity, sortBy])

  const getEntityLabel = (id: string | undefined | null) => {
    if (!id) return "Non assigné"
    return entities.find((e) => e.id === id)?.label ?? id
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "normal":
        return "text-blue-700 bg-blue-50 border border-blue-200"
      case "urgent":
        return "text-orange-700 bg-orange-50 border border-orange-200"
      case "very_urgent":
        return "text-red-700 bg-red-50 border border-red-200"
      default:
        return "text-gray-700 bg-gray-50"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "very_urgent":
        return "!!!!"
      case "urgent":
        return "!!!"
      default:
        return "!"
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce courrier ?")) return
    try {
      await apiDeleteCourrier(id)
      setCourriers((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur")
    }
  }

  const handleExportCSV = async () => {
    try {
      const blob = await apiExportCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `courriers_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur export")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-transparent w-fit">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Courriers</h1>
          <p className="text-muted-foreground">Gestion de vos courriers internes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
          {(user?.role === Role.AGENT || user?.role === Role.RESPONSABLE || user?.role === Role.SUPER_ADMIN) && (
            <Link href="/courriers/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau Courrier
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Recherche</label>
              <Input
                placeholder="Référence, sujet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">État</label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.values(ApiStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Catégorie</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Priorité</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {["normal", "urgent", "very_urgent"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tri</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Plus récent</SelectItem>
                  <SelectItem value="date_asc">Plus ancien</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filterState !== "all" || search || filterType !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("")
                setFilterState("all")
                setFilterType("all")
                setFilterCategory("all")
                setFilterPriority("all")
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Liste des courriers{" "}
            <span className="text-base font-normal text-muted-foreground">({filteredCourriers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Référence</th>
                  <th className="text-left py-3 px-4 font-semibold">Sujet</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">État</th>
                  <th className="text-center py-3 px-4 font-semibold">Priorité</th>
                  <th className="text-left py-3 px-4 font-semibold">Destination</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-center py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourriers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun courrier trouvé
                    </td>
                  </tr>
                ) : (
                  filteredCourriers.map((courrier) => (
                    <tr key={courrier.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{courrier.reference}</td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate text-sm">{courrier.subject}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">{types.find((t) => t.id === courrier.type)?.label ?? courrier.type ?? "-"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(courrier.status)}`}>
                          {courrier.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(courrier.priority ?? "normal")}`}>
                          {getPriorityIcon(courrier.priority ?? "normal")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">{getEntityLabel(courrier.toEntity)}</td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {new Date(courrier.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <Link href={`/courriers/${courrier.id}`}>
                            <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                          </Link>
                          {(user?.role === Role.AGENT || user?.role === Role.SUPER_ADMIN || user?.role === Role.RESPONSABLE) && (
                            <Link href={`/courriers/${courrier.id}/edit`}>
                              <Button variant="ghost" size="sm" className="hover:bg-orange-100">
                                <Edit2 className="w-4 h-4 text-orange-600" />
                              </Button>
                            </Link>
                          )}
                          {(user?.role === Role.SUPER_ADMIN || user?.role === Role.RESPONSABLE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(courrier.id)}
                              className="hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredCourriers.filter((c) => c.status === ApiStatus.RECEIVED).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredCourriers.filter((c) => c.status === ApiStatus.IN_PROGRESS).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Traités</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredCourriers.filter((c) => c.status === ApiStatus.DONE).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Urgents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredCourriers.filter((c) => c.priority === "urgent" || c.priority === "very_urgent").length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
