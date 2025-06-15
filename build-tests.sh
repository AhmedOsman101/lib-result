#!/usr/bin/env bash

set -euo pipefail

trap 'exit 1' SIGUSR1

# ---  Main script logic --- #
for file in tests/*.test.ts; do
  pnpm dlx esbuild "$file" --outfile="${file%.ts}.js" --format=esm
  output=$(sed -e 's|../src/index.ts|../dist/esm/index.js|' "${file%.ts}.js")
  echo "${output}" >"${file%.ts}.js"
done
