"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  apiCreateCourrier,
  apiUploadAttachment,
  apiReferentialsTypes,
  apiReferentialsCategories,
  apiReferentialsEntities,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Upload, X, ArrowLeft } from "lucide-react"

export default function CreateCourrierPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    type: "",
    category: "",
    toEntity: "",
    subject: "",
    description: "",
    priority: "normal",
  })
  const [files, setFiles] = useState<File[]>([])
  const [types, setTypes] = useState<{ id: string; label: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([])
  const [entities, setEntities] = useState<{ id: string; label: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      apiReferentialsTypes(),
      apiReferentialsCategories(),
      apiReferentialsEntities(),
    ]).then(([t, c, e]) => {
      setTypes(t)
      setCategories(c)
      setEntities(e)
    }).catch(console.error)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files
    if (f) setFiles((prev) => [...prev, ...Array.from(f)])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const generateReference = () => {
    const y = new Date().getFullYear()
    const m = String(new Date().getMonth() + 1).padStart(2, "0")
    const r = Math.random().toString(36).substring(2, 7).toUpperCase()
    return `ESTSB-${y}${m}-${r}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type || !formData.category || !formData.toEntity || !formData.subject) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }
    setIsSubmitting(true)
    try {
      const ref = generateReference()
      const courrier = await apiCreateCourrier({
        reference: ref,
        subject: formData.subject,
        body: formData.description,
        type: formData.type,
        category: formData.category,
        toEntity: formData.toEntity,
        priority: formData.priority,
      })
      for (const file of files) {
        await apiUploadAttachment(courrier.id, file)
      }
      router.push("/courriers")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-transparent w-fit mb-4">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Créer un Courrier</h1>
        <p className="text-muted-foreground">Ajoutez un nouveau courrier au système</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <Select value={formData.type} onValueChange={(v) => handleSelectChange("type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie *</label>
                <Select value={formData.category} onValueChange={(v) => handleSelectChange("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Destination (Entité) *</label>
                <Select value={formData.toEntity} onValueChange={(v) => handleSelectChange("toEntity", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <Select value={formData.priority} onValueChange={(v) => handleSelectChange("priority", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["normal", "urgent", "very_urgent"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sujet *</label>
              <Input
                name="subject"
                placeholder="Entrez le sujet du courrier"
                value={formData.subject}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                name="description"
                placeholder="Entrez la description détaillée du courrier"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pièces Jointes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <label className="cursor-pointer">
                <span className="text-sm font-medium text-primary">Cliquez pour télécharger</span>
                <p className="text-xs text-muted-foreground mt-1">PDF, images, Word</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{file.name}</p>
                    <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-red-100 rounded">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer le Courrier"}
          </Button>
        </div>
      </form>
    </div>
  )
}
