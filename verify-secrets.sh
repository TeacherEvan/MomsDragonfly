#!/usr/bin/env bash
# verify-secrets.sh - Verify all Mom's Dragonfly secrets are preserved

echo "=== MOM'S DRAGONFLY SECRET INVENTORY ==="
echo "Date: $(date)"
echo ""

echo "--- Convex Production (prod:rare-alpaca-711) ---"
npx convex env list --deployment prod:rare-alpaca-711 2>/dev/null || echo "  (use: CONVEX_DEPLOYMENT=prod:rare-alpaca-711 npx convex env list)"

echo ""
echo "--- Convex Dev (dev:different-squid-155) ---"
CONVEX_DEPLOYMENT=dev:different-squid-155 npx convex env list 2>/dev/null || echo "  (use: CONVEX_DEPLOYMENT=dev:different-squid-155 npx convex env list)"

echo ""
echo "--- Vercel Production ---"
npx vercel env ls --scope teacher-evans-projects 2>/dev/null || echo "  (requires vercel auth)"

echo ""
echo "--- Google Cloud Project ---"
gcloud services list --enabled --project=gen-lang-client-0822273391 --filter="name:places.googleapis.com OR name:apikeys.googleapis.com" 2>/dev/null || echo "  (requires gcloud auth)"

echo ""
echo "--- Critical Keys ---"
echo "GOOGLE_PLACES_API_KEY (Convex prod): $(CONVEX_DEPLOYMENT=prod:rare-alpaca-711 npx convex env get GOOGLE_PLACES_API_KEY 2>/dev/null | tr -d '\n')"
echo "GEMINI_API_KEY (Convex prod): $(CONVEX_DEPLOYMENT=prod:rare-alpaca-711 npx convex env get GEMINI_API_KEY 2>/dev/null | head -1)"
echo "BRAVE_SEARCH_API_KEY (Convex prod): $(CONVEX_DEPLOYMENT=prod:rare-alpaca-711 npx convex env get BRAVE_SEARCH_API_KEY 2>/dev/null | head -1)"
