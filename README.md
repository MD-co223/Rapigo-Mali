# 🟢 Rapigo Mali

![Version](https://img.shields.io/badge/version-2.7.0_Enterprise-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

> **Rapide • Fiable • Partout au Mali** — Votre plateforme de livraison N°1 au Mali

Rapigo Mali est une plateforme de livraison tout-en-un conçue pour le marché malien. Restaurants, supermarchés, pharmacies, boutiques, colis — tout est livré chez vous en quelques minutes.

## ✨ Fonctionnalités

### 🛍️ Espace Client
- Parcourir les commerçants et produits par catégorie
- Panier interactif avec gestion des quantités
- Commande avec choix de mode de paiement (Orange Money, Wave, Moov Money, etc.)
- Suivi de commande en temps réel
- Système de favoris et de coupons
- Portefeuille électronique
- Évaluation des livraisons
- Notifications en temps réel

### 🏪 Espace Commerçant
- Gestion complète du catalogue produits
- Gestion des commandes avec progression en temps réel
- Statistiques et tableaux de bord (Recharts)
- Configuration des zones de livraison et frais associés
- Création de coupons promotionnels
- Abonnement Premium à vie (4 000 FCFA)

### 🛵 Espace Livreur
- Toggle en ligne / hors ligne
- Acceptation et suivi des courses
- Progression de livraison (Assignée → Récupérée → En livraison → Livrée)
- Suivi des gains (jour / semaine / mois)
- Gestion du portefeuille et des retraits

### ⚙️ Espace Administrateur
- Tableau de bord avec indicateurs clés et graphiques
- Gestion des utilisateurs (clients, commerçants, livreurs)
- Approbation des commerçants et livreurs
- CRUD complet des catégories, produits et coupons
- Journal d'audit
- Paramètres système (commission, livraison, paiement, sécurité)

## 🛠️ Stack Technique

| Technologie | Rôle |
|---|---|
| [Next.js 16](https://nextjs.org/) | Framework React full-stack |
| [React 19](https://react.dev/) | Interface utilisateur |
| [TypeScript 5](https://www.typescriptlang.org/) | Typage statique |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styles utilitaires |
| [Prisma ORM](https://www.prisma.io/) | Base de données |
| [PostgreSQL / Supabase](https://supabase.com/) | Base de données hébergée |
| [shadcn/ui](https://ui.shadcn.com/) | Composants UI |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Zustand](https://zustand.docs.pmnd.rs/) | Gestion d'état |
| [Recharts](https://recharts.org/) | Graphiques |
| [Sonner](https://sonner.emilkowal.dev/) | Notifications toast |

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+ 
- **npm** ou **bun**

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-utilisateur/rapigo-mali.git
cd rapigo-mali

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec vos clés (DATABASE_URL, JWT_SECRET, etc.)

# 4. Initialiser la base de données
npx prisma db push
npx prisma db seed

# 5. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### Compte Super Admin (après seed)
- **Email** : diarramoussaka7@gmail.com
- **Mot de passe** : pispa2026

## 🌐 Déploiement (Vercel + Supabase)

### 1. Base de données Supabase
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier la **connection string** PostgreSQL
3. Configurer `DATABASE_URL` dans les variables d'environnement Vercel

### 2. Variables d'environnement Vercel
```
DATABASE_URL=postgresql://...
JWT_SECRET=votre-clé-secrète
NEXT_PUBLIC_APP_URL=https://rapigo.ml
```

### 3. Déploiement
```bash
# Initialiser Prisma en production
npx prisma db push
npx prisma db seed

# Déployer sur Vercel (via CLI ou GitHub integration)
vercel --prod
```

## 📁 Structure du Projet

```
rapigo-mali/
├── public/                 # Assets statiques (logos, favicons, manifest)
├── prisma/
│   └── schema.prisma      # Schéma de base de données (30 modèles)
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Layout racine (SEO, PWA, JSON-LD)
│   │   ├── page.tsx        # Landing page
│   │   ├── sitemap.ts      # Sitemap dynamique
│   │   ├── globals.css     # Styles globaux
│   │   └── api/            # 41 routes API
│   │       ├── auth/       # Login, Register, Me
│   │       ├── users/      # Gestion utilisateurs
│   │       ├── merchants/  # Gestion commerçants
│   │       ├── drivers/    # Gestion livreurs
│   │       ├── orders/     # Gestion commandes
│   │       ├── products/   # Gestion produits
│   │       ├── categories/ # Gestion catégories
│   │       ├── coupons/    # Gestion coupons
│   │       ├── notifications/ # Notifications
│   │       ├── favorites/  # Favoris
│   │       ├── wallet/     # Portefeuille
│   │       ├── support/    # Support
│   │       ├── stats/      # Statistiques
│   │       ├── plans/      # Plans d'abonnement
│   │       ├── settings/   # Paramètres système
│   │       └── audit-logs/ # Journal d'audit
│   ├── components/         # Composants réutilisables
│   │   ├── ui/             # Composants shadcn/ui
│   │   ├── providers/      # ThemeProvider
│   │   └── rapigo-logo.tsx # Logo officiel
│   ├── lib/
│   │   ├── db.ts           # Client Prisma
│   │   └── utils.ts        # Utilitaires
│   └── store/              # Stores Zustand
│       ├── auth.ts         # Authentification
│       ├── space.ts        # Navigation espaces
│       ├── client-nav.ts   # Navigation client (19 vues)
│       ├── merchant-nav.ts # Navigation commerçant (17 vues)
│       ├── driver-nav.ts   # Navigation livreur (13 vues)
│       ├── admin-nav.ts    # Navigation admin (18 vues)
│       └── cart.ts         # Panier
├── .env.example            # Variables d'environnement template
├── .gitignore
├── LICENSE                 # Licence MIT
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 👤 Auteur

**Mr. Diarra Moussa** — Fondateur, Rapigo Mali
- 📧 diarramoussaka7@gmail.com
- 📱 +223 77 16 38 62

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

© 2025 Rapigo Mali. Tous droits réservés.