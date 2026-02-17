const BASE = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

function getOptions(init?: RequestInit): RequestInit {
  return {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  }
}

export async function apiRegister(body: {
  email: string
  password: string
  name?: string
  role?: string
}) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    ...getOptions({ body: JSON.stringify(body) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Erreur d'inscription")
  }
  return res.json()
}

export async function apiLogin(body: { email: string; password: string }) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    ...getOptions({ body: JSON.stringify(body) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Identifiants invalides")
  }
  return res.json()
}

export async function apiLogout() {
  const res = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    ...getOptions(),
  })
  if (!res.ok) throw new Error("Erreur déconnexion")
  return res.json()
}

export async function apiMe() {
  const res = await fetch(`${BASE}/api/auth/me`, { ...getOptions() })
  if (!res.ok) return null
  return res.json()
}

export async function apiCourriers(params?: { page?: number; limit?: number; q?: string; status?: string }) {
  const sp = new URLSearchParams()
  if (params?.page != null) sp.set("page", String(params.page))
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.q) sp.set("q", params.q)
  if (params?.status) sp.set("status", params.status)
  const res = await fetch(`${BASE}/api/courriers?${sp}`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur chargement courriers")
  return res.json()
}

export async function apiCourrierById(id: string) {
  const res = await fetch(`${BASE}/api/courriers/${id}`, { ...getOptions() })
  if (!res.ok) if (res.status === 404) return null; else throw new Error("Erreur chargement courrier")
  return res.json()
}

export async function apiCreateCourrier(body: {
  reference: string
  subject: string
  body?: string
  sender?: string
  recipient?: string
  type?: string
  category?: string
  priority?: string
  toEntity?: string
  fromEntity?: string
}) {
  const res = await fetch(`${BASE}/api/courriers`, {
    method: "POST",
    ...getOptions({ body: JSON.stringify(body) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Erreur création courrier")
  }
  return res.json()
}

export async function apiDeleteCourrier(id: string) {
  const res = await fetch(`${BASE}/api/courriers/${id}`, {
    method: "DELETE",
    ...getOptions(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Erreur suppression")
  }
  return res.json()
}

export async function apiUpdateCourrier(
  id: string,
  body: Partial<{
    subject: string
    body: string
    sender: string
    recipient: string
    status: string
    type: string
    category: string
    priority: string
  }>
) {
  const res = await fetch(`${BASE}/api/courriers/${id}`, {
    method: "PUT",
    ...getOptions({ body: JSON.stringify(body) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Erreur mise à jour")
  }
  return res.json()
}

export async function apiAssignCourrier(id: string, userId: string) {
  const res = await fetch(`${BASE}/api/courriers/${id}/assign`, {
    method: "POST",
    ...getOptions({ body: JSON.stringify({ userId }) }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Erreur assignation")
  }
  return res.json()
}

export async function apiUploadAttachment(courrierId: string, file: File) {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${BASE}/api/courriers/${courrierId}/attachments`, {
    method: "POST",
    credentials: "include",
    body: form,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Erreur upload")
  }
  return res.json()
}

export async function apiStatistics() {
  const res = await fetch(`${BASE}/api/statistics`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur statistiques")
  return res.json()
}

export async function apiExportCSV() {
  const res = await fetch(`${BASE}/api/export?type=csv`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur export")
  return res.blob()
}

export async function apiReferentialsEntities() {
  const res = await fetch(`${BASE}/api/referentials/entities`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur entités")
  return res.json()
}

export async function apiReferentialsCategories() {
  const res = await fetch(`${BASE}/api/referentials/categories`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur catégories")
  return res.json()
}

export async function apiReferentialsTypes() {
  const res = await fetch(`${BASE}/api/referentials/types`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur types")
  return res.json()
}

export async function apiReferentialsStates() {
  const res = await fetch(`${BASE}/api/referentials/states`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur états")
  return res.json()
}

export async function apiUsers() {
  const res = await fetch(`${BASE}/api/users`, { ...getOptions() })
  if (!res.ok) throw new Error("Erreur utilisateurs")
  return res.json()
}
