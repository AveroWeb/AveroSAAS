# Agence SaaS

Logiciel interne de gestion pour agence web : clients, sites, domaines, hébergements, outils, maintenance, incidents, abonnements et rentabilité — le tout dans une seule interface simple.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [PostgreSQL](https://www.postgresql.org/) via [Prisma 7](https://www.prisma.io/) (driver adapter `@prisma/adapter-pg`)
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Base UI)
- [Auth.js v5](https://authjs.dev/) (Credentials + JWT), multi-tenant par organisation
- Rôles : `ADMIN`, `MEMBER` (équipe agence) et `CLIENT` (portail client, à venir)

## Mise en route

### 1. Base de données

Ce projet utilise PostgreSQL. En développement, [Neon](https://neon.tech) (gratuit, sans installation) est recommandé :

1. Crée un compte sur [neon.tech](https://neon.tech) et un projet.
2. Copie la chaîne de connexion (`postgresql://...`).

### 2. Variables d'environnement

Copie `.env.example` vers `.env` et renseigne :

```bash
cp .env.example .env
```

- `DATABASE_URL` — ta chaîne de connexion PostgreSQL.
- `AUTH_SECRET` — génère-en un avec `openssl rand -base64 32`.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` / `SEED_ORG_NAME` — utilisés uniquement par le script de seed pour créer ton premier compte admin.

### 3. Installation, migrations et données de démo

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) et connecte-toi avec l'email/mot de passe définis dans `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Scripts utiles

```bash
npm run dev        # serveur de développement
npm run build       # build de production
npm run lint         # ESLint
npx tsc --noEmit     # vérification TypeScript
npx prisma studio    # explorateur de données
```

## État du projet (par phase)

- ✅ **Phase 1 — Fondation** : auth, organisation (multi-tenant), schéma de base de données complet, layout principal, Dashboard, gestion des Clients, fiche Client détaillée.
- ⏳ **Phase 2 — Gestion opérationnelle** : pages dédiées Sites / Domaines / Hébergements / Outils / Tâches (actuellement consultables uniquement depuis la fiche client).
- ⏳ **Phase 3 — Maintenance** : maintenances récurrentes automatiques, incidents en gestion autonome, alertes avancées.
- ⏳ **Phase 4 — Argent** : gestion des forfaits et facturation.
- ⏳ **Phase 5 — Portail client** : authentification client, tickets, rapports.
- ⏳ **Phase 6 — Automatisation** : monitoring externe, notifications, IA.

Le schéma de base de données (`prisma/schema.prisma`) couvre déjà l'ensemble de ces phases pour éviter les migrations disruptives plus tard.
