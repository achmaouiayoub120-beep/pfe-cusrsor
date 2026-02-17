"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiStatistics } from "@/lib/api"
import { ApiStatus } from "@/lib/types"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
  "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#A855F7", "#6366F1",
]

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<{
    totalCourriers: number
    byStatus: Record<string, number>
    recentCourriers: { id: string; reference: string; subject: string; status: string; createdAt: string }[]
  } | null>(null)

  useEffect(() => {
    apiStatistics()
      .then(setStats)
      .catch(() => setStats({ totalCourriers: 0, byStatus: {}, recentCourriers: [] }))
  }, [])

  const stateData = stats
    ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))
    : []

  const StatCard = ({
    title,
    value,
    color,
  }: {
    title: string
    value: number | string
    color?: string
  }) => (
    <Card className={color ? `border-l-4 ${color}` : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-8 p-6">
      <div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-transparent w-fit mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Bienvenue dans le système de gestion du courrier</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Courriers" value={stats.totalCourriers} color="border-l-primary" />
            <StatCard title="Reçus" value={stats.byStatus[ApiStatus.RECEIVED] ?? 0} color="border-l-blue-500" />
            <StatCard title="En Cours" value={stats.byStatus[ApiStatus.IN_PROGRESS] ?? 0} color="border-l-yellow-500" />
            <StatCard title="Traités" value={stats.byStatus[ApiStatus.DONE] ?? 0} color="border-l-green-500" />
            <StatCard title="Archivés" value={stats.byStatus[ApiStatus.ARCHIVED] ?? 0} color="border-l-gray-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution par État</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stateData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Derniers courriers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(stats.recentCourriers ?? []).slice(0, 5).map((c) => (
                    <li key={c.id} className="flex justify-between text-sm">
                      <span className="truncate">{c.reference} — {c.subject}</span>
                      <span className="text-muted-foreground">{c.status}</span>
                    </li>
                  ))}
                  {(!stats.recentCourriers || stats.recentCourriers.length === 0) && (
                    <li className="text-muted-foreground">Aucun courrier</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!stats && (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      )}
    </div>
  )
}
