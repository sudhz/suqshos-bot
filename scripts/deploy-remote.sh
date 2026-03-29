#!/bin/sh
set -eu

DEPLOY_PATH=${DEPLOY_PATH:?DEPLOY_PATH is required}
REPO_URL=${REPO_URL:?REPO_URL is required}
BUN_INSTALL=${BUN_INSTALL:-"$HOME/.bun"}
BUN_BIN=${BUN_BIN:-"$BUN_INSTALL/bin/bun"}

if [ ! -x "$BUN_BIN" ]; then
  printf '%s\n' "Bun was not found at $BUN_BIN" >&2
  exit 1
fi

if [ ! -d "$DEPLOY_PATH/.git" ]; then
  git clone --branch main --single-branch "$REPO_URL" "$DEPLOY_PATH"
else
  git -C "$DEPLOY_PATH" checkout main
  git -C "$DEPLOY_PATH" pull --ff-only origin main
fi

cd "$DEPLOY_PATH"
chmod +x scripts/start-service.sh scripts/deploy-remote.sh
"$BUN_BIN" install --frozen-lockfile
