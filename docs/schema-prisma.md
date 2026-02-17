# Schéma de données (Prisma)

## Modèles principaux

```
User
  - id (uuid)
  - email (unique)
  - name, password, role (enum: SUPER_ADMIN | RESPONSABLE | AGENT | ARCHIVISTE)
  - entityId, isActive
  - assignedCourriers → Courrier[] (assignedTo)
  - histories → History[]

Courrier
  - id (uuid), reference (unique), subject, body?, sender?, recipient?
  - type?, category?, priority?, status (enum: RECEIVED | IN_PROGRESS | ASSIGNED | DONE | ARCHIVED)
  - fromEntity?, toEntity?, createdBy?, assignedTo?
  - attachments → Attachment[]
  - history → History[]
  - assignedUser → User?

Attachment
  - id, filename, url, courrierId → Courrier, uploadedAt

History
  - id, courrierId → Courrier, actorId → User, action, fromStatus?, toStatus?, note?, createdAt
```

## Référentiels

- **Entity** : id, label, description, code, email, phone, chefId
- **Category** : id, label, description
- **CourierType** : id, label, description
- **RefState** : id, label, description, color

## Workflow courrier (états)

RECEIVED → IN_PROGRESS → ASSIGNED → DONE → ARCHIVED

Chaque changement d’état est enregistré dans `History` (actor, fromStatus, toStatus, note).
