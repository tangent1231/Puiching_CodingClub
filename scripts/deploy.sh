#!/usr/bin/env bash
set -euo pipefail

# 手動部署腳本：前端由 Vercel 自動處理，此腳本只部署 Supabase Edge Functions。

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_REF="mwxjqfiseswpijxjtdsw"

cd "$ROOT_DIR"

echo "==> Linking Supabase project..."
supabase link --project-ref "$PROJECT_REF"

echo "==> Deploying Edge Functions..."
supabase functions deploy

echo "==> Done. Frontend will be deployed automatically by Vercel on push."
