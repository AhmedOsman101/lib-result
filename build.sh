#!/usr/bin/env bash

set -euo pipefail

trap 'exit 1' SIGUSR1

# ---  Main script logic --- #
pnpm clean &&
  pnpm build:tests &&
  pnpm format &&
  pnpm exec tsup &&
  pnpm exec attw --pack .
