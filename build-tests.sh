#!/usr/bin/env bash

set -euo pipefail

trap 'exit 1' SIGUSR1

# ---  Main script logic --- #
for file in tests/*.test.ts; do
  pnpm exec esbuild "$file" --outfile="${file%.ts}.js" --format=esm
done
