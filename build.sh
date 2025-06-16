#!/usr/bin/env bash

set -euo pipefail

trap 'exit 1' SIGUSR1

# ---  Main script logic --- #
pnpm clean && pnpm build:tests

pnpm exec rollup --config

mkdir -p dist/{esm,cjs}

mv dist/tmp/index.esm.js dist/esm/index.js
mv dist/tmp/index.cjs dist/cjs/index.js
rm -rf dist/tmp

cjsPkg="dist/cjs/package.json"

cp package.json "${cjsPkg}"
sed 's|"module"|"commonjs"|' package.json >"${cjsPkg}"
