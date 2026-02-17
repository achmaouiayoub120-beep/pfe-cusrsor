# Note technique — Architecture PFE Gestion du Courrier

## Choix techniques

- **Next.js 16 (App Router)** : une seule codebase pour le front et les API, déploiement simple (Vercel).
- **Prisma + PostgreSQL** : schéma typé, migrations, requêtes sûres ; PostgreSQL pour la persistance relationnelle.
- **Authentification** : JWT signé avec `JWT_SECRET`, stocké dans un **cookie HttpOnly** (SameSite=Lax, Secure en prod). Pas de token en localStorage pour limiter les risques XSS. Hachage des mots de passe avec **bcrypt** (facteur 12).
- **RBAC** : rôles SUPER_ADMIN, RESPONSABLE, AGENT, ARCHIVISTE ; vérification côté API sur chaque route protégée (`requireRole`).
- **Upload** : stockage local dans `uploads/` (hors dépôt Git) ; en production, brancher S3 ou équivalent via variables d’environnement.
- **Audit** : table `History` et helper `recordHistory()` pour chaque changement d’état ou action significative sur un courrier.

## Flux principal

1. **Connexion** : `POST /api/auth/login` → vérification bcrypt → émission JWT → cookie HttpOnly.
2. **Requêtes protégées** : lecture du cookie dans `getUserFromRequest()` → vérification JWT → `requireRole()` selon la route.
3. **Courrier** : création → statut RECEIVED ; changement d’état via `PUT /api/courriers/:id` → enregistrement dans `History`.
4. **Pièces jointes** : `POST /api/courriers/:id/attachments` (multipart) → enregistrement sur disque + ligne `Attachment` en base.

## Sécurité

- Headers : X-Content-Type-Options, X-Frame-Options, Referrer-Policy (middleware Next.js).
- Validation des entrées : Zod sur les body JSON des API.
- Pas de secret en dur ; variables d’environnement pour DATABASE_URL et JWT_SECRET.

## Schémas

Voir en complément (à ajouter dans `docs/`) :
- MCD / schéma Prisma (entités User, Courrier, Attachment, History, référentiels).
- Diagramme de séquence : workflow courrier (création → attribution → changement d’état → historique).
