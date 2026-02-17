# Checklist déploiement production

## Variables d'environnement à renseigner

- **DATABASE_URL** : URL PostgreSQL de production (ex. fournie par Vercel Postgres, Neon, Supabase)
- **JWT_SECRET** : Chaîne longue et aléatoire (générer avec `openssl rand -base64 32`)
- **NODE_ENV** : `production`
- **MAX_UPLOAD_SIZE** (optionnel) : Taille max upload en octets
- **S3_*** (optionnel) : Si stockage S3 pour les pièces jointes (S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY)

## Étapes de déploiement (ex. Vercel)

1. Créer un projet Vercel et lier le dépôt Git.
2. Configurer les variables d'environnement dans le dashboard Vercel (Settings → Environment Variables).
3. Ne pas exécuter `prisma migrate` depuis le build Vercel sur la DB de prod : exécuter les migrations une fois manuellement (`npx prisma migrate deploy`) depuis une machine de confiance ou un job CI dédié, avec DATABASE_URL de prod.
4. Optionnel : configurer un stockage S3 (ou équivalent) et adapter le code d’upload si besoin.
5. Déclencher un déploiement (push sur la branche connectée).

## Après déploiement

- Tester : login, création d’un courrier, upload d’une pièce jointe, consultation de l’historique.
- Vérifier que le cookie de session est bien HttpOnly et Secure en HTTPS.
