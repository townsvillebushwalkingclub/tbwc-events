#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

. "$ROOT/tools/git-author-config.sh"

git config --local user.name "$GIT_AUTHOR_NAME"
git config --local user.email "$GIT_AUTHOR_EMAIL"
git config --local core.hooksPath .githooks

chmod +x .githooks/prepare-commit-msg

echo "Configured local git author for this repository:"
echo "  user.name  = $(git config --local user.name)"
echo "  user.email = $(git config --local user.email)"
echo "  hooksPath  = $(git config --local core.hooksPath)"
echo "Commits will include: $GIT_CO_AUTHOR_TRAILER"
