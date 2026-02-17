# Changelog

## [PFE Backend + Auth + Prisma] — feat/pfe/backend-auth-prisma

### Ajouté

- **Backend**
  - Prisma (schéma User, Courrier, Attachment, History, Entity, Category, CourierType, RefState) + PostgreSQL
  - Routes API : auth (register, login, logout, me), courriers (CRUD, assign, attachments), statistics, export CSV, referentials (entities, types, categories, states), users
  - Authentification : bcrypt (hash 12), JWT en cookie HttpOnly, lib/auth (getUserFromRequest, requireRole)
  - Audit : enregistrement des changements d’état et actions dans la table History
  - Upload de pièces jointes (stockage local `uploads/`, route de téléchargement `/uploads/[...path]`)
- **Frontend**
  - Remplacement de localStorage par des appels API (lib/api.ts)
  - Auth context basé sur /api/auth/me et login/logout API
  - Pages courriers, dashboard, users, entités, référentiels alimentées par l’API
- **Sécurité**
  - Middleware (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
  - Validation Zod sur les endpoints
- **Tests & CI**
  - Jest + test unitaire auth (sign/verify token)
  - Playwright + scénario E2E login
  - GitHub Actions (install, prisma generate, test, build)
- **Documentation**
  - README (installation, variables, commandes, endpoints)
  - .env.example
  - docs/architecture.md
  - CHANGELOG.md

### Modifié

- Rôles : SUPER_ADMIN, RESPONSABLE, AGENT, ARCHIVISTE (alignés Prisma)
- États courrier : RECEIVED, IN_PROGRESS, ASSIGNED, DONE, ARCHIVED
- Types TypeScript (User, Courier, Attachment, StateHistory) alignés avec l’API

### Dépendances

- prisma, @prisma/client, bcrypt, jsonwebtoken, formidable, zod, dotenv
- jest, ts-jest, @types/jest, playwright, supertest, tsx
