#!/usr/bin/env bash
# shellcheck disable=SC2046,SC2148

gitRoot="$(git rev-parse --show-toplevel)"

cd "${gitRoot}" || exit 1

declare -a files
mapfile -t files < <(git diff --cached --name-only --diff-filter=ACMR)

# --- Formats only the staged files --- #
unset BIOME_BINARY &>/dev/null || true
unset BIOME_CONFIG_PATH &>/dev/null || true
pnpm exec biome check --fix --no-errors-on-unmatched "${files[@]}" || true

# --- Adds staged files again (to include the new formatter changes) --- #
git add "${files[@]}"

# --- Do type checking before any commit --- #
printf "\e[34mDoing type checks...\e[0m\n"
pnpm typecheck || exit 1

exit 0
