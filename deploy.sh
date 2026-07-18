#!/bin/bash
# ============================================================
# 🚀 RAPIGO MALI V2.7 — DÉPLOIEMENT AUTOMATIQUE COMPLET
# ============================================================
# Exécutez ce script sur votre machine locale :
#   chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚀 RAPIGO MALI V2.7 — DÉPLOIEMENT PRODUCTION  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ---- STEP 0: Check prerequisites ----
echo -e "${YELLOW}📋 Étape 0 : Vérification des prérequis...${NC}"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    echo -e "  ${GREEN}✅${NC} $1 trouvé"
  else
    echo -e "  ${RED}❌${NC} $1 NON trouvé — Installation en cours..."
    case "$1" in
      git) sudo apt install -y git ;;
      node) curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs ;;
      bun) curl -fsSL https://bun.sh/install | bash && source ~/.bashrc ;;
      vercel) npm i -g vercel ;;
      gh) 
        # Install official GitHub CLI
        type -p curl >/dev/null || sudo apt install -y curl
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update && sudo apt install -y gh
        ;;
    esac
  fi
}

check_cmd git
check_cmd node
check_cmd bun
check_cmd vercel
check_cmd gh

echo ""

# ---- STEP 1: Push to GitHub ----
echo -e "${YELLOW}📋 Étape 1 : Envoi vers GitHub...${NC}"

if [ ! -d ".git" ]; then
  git init
  git remote add origin https://github.com/MD-co223/Rapigo-Mali.git
fi

git remote set-url origin https://github.com/MD-co223/Rapigo-Mali.git

# Login to GitHub if needed
if ! gh auth status &>/dev/null; then
  echo -e "${YELLOW}Connexion GitHub requise...${NC}"
  gh auth login --with-token < <(echo "VOTRE_GITHUB_TOKEN_ICI") 2>/dev/null || gh auth login
fi

# Configure git to use gh as credential helper
gh auth setup-git

echo -e "${GREEN}  📤 Push vers GitHub...${NC}"
git push -u origin main --force 2>/dev/null || git push -u origin main
echo -e "${GREEN}  ✅ Code envoyé sur GitHub !${NC}"
echo ""

# ---- STEP 2: Supabase Setup ----
echo -e "${YELLOW}📋 Étape 2 : Configuration Supabase PostgreSQL...${NC}"
echo -e "${CYAN}  Si vous n'avez pas encore de projet Supabase :${NC}"
echo -e "  1. Allez sur https://supabase.com/dashboard"
echo -e "  2. Créez un nouveau projet (région: eu-west-1 ou af-south-1)"
echo -e "  3. Récupérez les infos de connexion"
echo ""
echo -e "${CYAN}  Variables requises :${NC}"
echo -e "  DATABASE_URL = postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
echo -e "  DIRECT_URL = postgresql://postgres.[ref]:[password]@aws-0-[region].supabase.com:5432/postgres?sslmode=require"
echo ""
read -p "  Entrez votre DATABASE_URL (Supabase) : " DATABASE_URL
read -p "  Entrez votre DIRECT_URL (Supabase) : " DIRECT_URL
read -p "  Entrez votre JWT_SECRET (ou Entrée pour en générer un) : " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
fi

# Generate a secure .env file
cat > .env.local << EOF
# ==============================================
# RAPIGO MALI V2.7 — Production Environment
# ==============================================

# --- Supabase PostgreSQL ---
DATABASE_URL="$DATABASE_URL"
DIRECT_URL="$DIRECT_URL"

# --- Sécurité ---
JWT_SECRET="$JWT_SECRET"

# --- Application ---
NEXT_PUBLIC_APP_URL="https://rapigo-mali.vercel.app"
PORT=3000
EOF

echo -e "${GREEN}  ✅ Fichier .env.local créé avec succès${NC}"
echo ""

# ---- STEP 3: Prisma Migrate & Seed ----
echo -e "${YELLOW}📋 Étape 3 : Migration & Seed de la base de données...${NC}"
echo -e "  📦 Installation des dépendances..."
bun install
echo -e "  🔄 Génération du client Prisma..."
bunx prisma generate
echo -e "  🚀 Application du schéma à la base..."
bunx prisma db push
echo -e "  🌱 Seeding des données initiales..."
bunx prisma db seed
echo -e "${GREEN}  ✅ Base de données prête !${NC}"
echo ""

# ---- STEP 4: Vercel Deployment ----
echo -e "${YELLOW}📋 Étape 4 : Déploiement sur Vercel...${NC}"

# Login to Vercel if needed
if ! vercel whoami &>/dev/null; then
  echo -e "${YELLOW}Connexion Vercel requise...${NC}"
  vercel login
fi

# Set environment variables on Vercel
echo -e "  🔧 Configuration des variables d'environnement..."
vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add DIRECT_URL production <<< "$DIRECT_URL"
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://rapigo-mali.vercel.app"

# Also set for preview
vercel env add DATABASE_URL preview <<< "$DATABASE_URL"
vercel env add DIRECT_URL preview <<< "$DIRECT_URL"
vercel env add JWT_SECRET preview <<< "$JWT_SECRET"
vercel env add NEXT_PUBLIC_APP_URL preview <<< "https://rapigo-mali.vercel.app"

# Link to Vercel project
echo -e "  🔗 Liaison au projet Vercel..."
vercel link --yes 2>/dev/null || true

# Deploy!
echo -e "  🚀 Déploiement en cours..."
vercel --prod

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !         ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   📦 GitHub : github.com/MD-co223/Rapigo-Mali  ║${NC}"
echo -e "${GREEN}║   🌐 App    : https://rapigo-mali.vercel.app   ║${NC}"
echo -e "${GREEN}║   🗄️  Supabase : Configuré ✅                    ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   👤 Super Admin :                              ║${NC}"
echo -e "${GREEN}║      diarramoussaka7@gmail.com                  ║${NC}"
echo -e "${GREEN}║      Mot de passe : pispa2026                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"