#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
APP_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
BUN_INSTALL=${BUN_INSTALL:-"$HOME/.bun"}
BUN_BIN=${BUN_BIN:-"$BUN_INSTALL/bin/bun"}

export BUN_INSTALL
export PATH="$BUN_INSTALL/bin:$PATH"

cd "$APP_ROOT"
exec "$BUN_BIN" run start
