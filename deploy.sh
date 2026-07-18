#!/bin/bash
# ============================================================
# 🚀 RAPIGO MALI V2.7 — DÉPLOIEMENT AUTOMATIQUE COMPLET
# ============================================================
# Sur votre machine locale, dans le dossier du projet :
#   chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}  $1${NC}"; }
ok()    { echo -e "${GREEN}  ✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()   { echo -e "${RED}  ❌ $1${NC}"; }
step()  { echo ""; echo -e "${YELLOW}${BOLD}📋 Étape $1 : $2${NC}"; echo ""; }

banner() {
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}║   🚀 RAPIGO MALI V2.7 ENTERPRISE                     ║${NC}"
echo -e "${CYAN}║      Déploiement Production Automatique               ║${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
}

success() {
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║   ✅  DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !              ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║   📦  GitHub    :  github.com/MD-co223/Rapigo-Mali   ║${NC}"
echo -e "${GREEN}║   🌐  App       :  ${VERCEL_URL:-https://rapigo-mali.vercel.app}   ${NC}"
echo -e "${GREEN}║   🗄️  Supabase  :  Configuré ✅                      ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║   👤  Super Admin :                                  ║${NC}"
echo -e "${GREEN}║       diarramoussaka7@gmail.com                      ║${NC}"
echo -e "${GREEN}║       Mot de passe : pispa2026                       ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
}

detect_os() {
  case "$(uname -s)" in
    Linux*)  OS="linux"  ;;
    Darwin*) OS="macos"  ;;
    *)       OS="unknown" ;;
  esac
}

ensure_bun() {
  if command -v bun &>/dev/null; then
    ok "bun $(bun --version) installé"
    return 0
  fi
  warn "bun non trouvé — installation..."
  curl -fsSL https://bun.sh/install | bash
  # Source bun into current shell
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  if command -v bun &>/dev/null; then
    ok "bun installé avec succès"
  else
    err "Impossible d'installer bun. Installez-le manuellement : https://bun.sh"
    exit 1
  fi
}

ensure_gh() {
  if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    ok "GitHub CLI connecté : $(gh auth status 2>&1 | head -1)"
    return 0
  fi

  if ! command -v gh &>/dev/null; then
    warn "GitHub CLI non trouvé — installation..."
    if [ "$OS" = "macos" ]; then
      brew install gh
    else
      type -p curl >/dev/null || (sudo apt update && sudo apt install -y curl)
      curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
      sudo apt update && sudo apt install -y gh
    fi
  fi

  # Try to login with token
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo "$GITHUB_TOKEN" | gh auth login --with-token
    ok "Connecté via GITHUB_TOKEN"
    return 0
  fi

  # Interactive login
  warn "Connexion GitHub interactive requise..."
  gh auth login
  gh auth setup-git
  ok "GitHub CLI connecté"
}

ensure_vercel() {
  if command -v vercel &>/dev/null && vercel whoami &>/dev/null 2>&1; then
    ok "Vercel CLI connecté"
    return 0
  fi

  if ! command -v vercel &>/dev/null; then
    warn "Vercel CLI non trouvé — installation via npm..."
    npm i -g vercel
  fi

  if [ -n "${VERCEL_TOKEN:-}" ]; then
    vercel login --token "$VERCEL_TOKEN"
    ok "Vercel connecté via VERCEL_TOKEN"
    return 0
  fi

  warn "Connexion Vercel interactive requise..."
  vercel login
  ok "Vercel connecté"
}

# ============================
# MAIN
# ============================

banner
detect_os
info "OS détecté : $OS"

# ------------------------------------------
step 0 "Prérequis"
# ------------------------------------------
ensure_bun
ensure_gh
ensure_vercel

# ------------------------------------------
step 1 "GitHub — Envoi du code"
# ------------------------------------------

# Ensure we're in a git repo
if [ ! -d ".git" ]; then
  err "Pas de dépôt Git trouvé. Ce script doit être exécuté dans le dossier du projet."
  echo "  → Clonez d'abord : git clone https://github.com/MD-co223/Rapigo-Mali.git"
  echo "  → Ou initialisez : git init && git add . && git commit -m 'init'"
  exit 1
fi

# Set remote
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/MD-co223/Rapigo-Mali.git
info "Remote : $(git remote get-url origin)"

# Ensure git uses gh credentials
gh auth setup-git 2>/dev/null || true

# Push
info "Envoi vers GitHub..."
if git push -u origin main --force 2>/dev/null; then
  ok "Code envoyé sur GitHub !"
elif git push -u origin main 2>/dev/null; then
  ok "Code envoyé sur GitHub !"
else
  err "Échec du push. Vérifiez vos droits sur le dépôt."
  info "Essayez : gh repo create MD-co223/Rapigo-Mali --public --source=. --push"
  exit 1
fi

# ------------------------------------------
step 2 "Supabase — Base de données"
# ------------------------------------------

echo -e "${CYAN}  Créez un projet Supabase si ce n'est pas fait :${NC}"
echo -e "  → https://supabase.com/dashboard/projects/new"
echo -e "  → Région recommandée : ${BOLD}eu-west-1${NC} (Europe) ou ${BOLD}af-south-1${NC} (Afrique du Sud)"
echo ""

# Read DATABASE_URL
if [ -n "${DATABASE_URL:-}" ]; then
  info "DATABASE_URL trouvé dans l'environnement"
else
  echo -e "${BOLD}  DATABASE_URL${NC} (Connection Pooling — port 6543) :"
  echo -e "  Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
  echo ""
  read -r -p "  → Collez votre DATABASE_URL : " DATABASE_URL
fi

if [ -n "${DIRECT_URL:-}" ]; then
  info "DIRECT_URL trouvé dans l'environnement"
else
  echo ""
  echo -e "${BOLD}  DIRECT_URL${NC} (Session Mode — port 5432) :"
  echo -e "  Format: postgresql://postgres.[ref]:[password]@aws-0-[region].supabase.com:5432/postgres?sslmode=require"
  echo ""
  read -r -p "  → Collez votre DIRECT_URL : " DIRECT_URL
fi

# Generate JWT_SECRET
if [ -n "${JWT_SECRET:-}" ]; then
  info "JWT_SECRET trouvé dans l'environnement"
else
  JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
  ok "JWT_SECRET généré automatiquement"
fi

# Create .env.local
cat > .env.local << ENVEOF
# ==============================================
# RAPIGO MALI V2.7 — Production
# ==============================================

# --- Supabase PostgreSQL ---
DATABASE_URL="${DATABASE_URL}"
DIRECT_URL="${DIRECT_URL}"

# --- Sécurité ---
JWT_SECRET="${JWT_SECRET}"

# --- Application ---
NEXT_PUBLIC_APP_URL="https://rapigo-mali.vercel.app"
PORT=3000
ENVEOF

ok ".env.local créé"
echo ""

# ------------------------------------------
step 3 "Prisma — Migration & Seed"
# ------------------------------------------

info "Installation des dépendances..."
bun install --frozen-lockfile 2>/dev/null || bun install

info "Génération du client Prisma..."
bunx prisma generate

info "Application du schéma à la base Supabase..."
bunx prisma db push --accept-data-loss 2>/dev/null || bunx prisma db push

info "Seed des données initiales..."
bunx prisma db seed

ok "Base de données prête !"
echo ""

# ------------------------------------------
step 4 "Vercel — Déploiement"
# ------------------------------------------

# Set env vars on Vercel
info "Configuration des variables d'environnement sur Vercel..."

for ENV in production preview development; do
  echo "$DATABASE_URL" | vercel env add DATABASE_URL "$ENV" 2>/dev/null
  echo "$DIRECT_URL"   | vercel env add DIRECT_URL "$ENV"   2>/dev/null
  echo "$JWT_SECRET"   | vercel env add JWT_SECRET "$ENV"   2>/dev/null
  echo "https://rapigo-mali.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL "$ENV" 2>/dev/null
done
ok "Variables d'environnement configurées"

# Link project
info "Liaison au projet Vercel..."
vercel link --yes 2>/dev/null || true

# Deploy to production
info "🚀 Déploiement en cours... (cela peut prendre 2-3 minutes)"
DEPLOY_OUTPUT=$(vercel --prod 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract URL from output
VERCEL_URL=$(echo "$DEPLOY_OUTPUT" | rg -o 'https://[a-z0-9-]+\.vercel\.app' | head -1)
if [ -z "$VERCEL_URL" ]; then
  VERCEL_URL="https://rapigo-mali.vercel.app"
fi

# ------------------------------------------
# DONE!
# ------------------------------------------
VERCEL_URL="$VERCEL_URL" success

info "N'oubliez pas de changer le mot de passe du Super Admin après la première connexion !"