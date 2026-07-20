#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-extension.sh
# Run this on the HOST (outside any container) to compile the TypeScript
# extension and produce a .vsix that the devcontainer can install directly.
#
# Usage (from project root):
#   bash vscode-extension-scripts/build-extension.sh
#
# Output: .devcontainer/ai-mutation-testing.vsix
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="${REPO_ROOT}/vscode-extension"
VSIX_OUT="${REPO_ROOT}/project-sources/.devcontainer/ai-mutation-testing.vsix"

echo "──────────────────────────────────────────────────"
echo "▶ Building AI Mutation Testing VS Code extension"
echo "  Source : ${EXT_DIR}"
echo "  Output : ${VSIX_OUT}"
echo "──────────────────────────────────────────────────"

cd "${EXT_DIR}"

# ── Compatibility shim for host Node.js versions < 20 ───────────────────────
# The current npm-distributed @vscode/vsce chain pulls in undici, which expects
# a global File implementation. Node 18.x does not provide File, so we preload
# a tiny polyfill before invoking vsce.
NODE_MAJOR_VERSION="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "${NODE_MAJOR_VERSION}" -lt 20 ]]; then
	VSCE_POLYFILL="$(mktemp /tmp/vsce-file-polyfill-XXXXXX.cjs)"
	cat > "${VSCE_POLYFILL}" <<'EOF'
const { Blob } = require('buffer');

if (typeof globalThis.File === 'undefined') {
	globalThis.File = class File extends Blob {
		constructor(parts, name, options = {}) {
			super(parts, options);
			this.name = String(name);
			this.lastModified = options.lastModified ?? Date.now();
		}
	};
}
EOF
	trap 'rm -f "${VSCE_POLYFILL}"' EXIT
	export NODE_OPTIONS="--require ${VSCE_POLYFILL}${NODE_OPTIONS:+ ${NODE_OPTIONS}}"
fi

# ── Step 1: Install npm dependencies ─────────────────────────────────────────
echo "  [1/3] Installing npm dependencies..."
npm ci

# ── Step 2: Compile TypeScript → out/ ────────────────────────────────────────
echo "  [2/3] Compiling TypeScript..."
npm run compile

# ── Step 3: Pack .vsix ───────────────────────────────────────────────────────
# --no-dependencies: marketplace deps are listed in devcontainer.json
echo "  [3/3] Packaging .vsix..."
npx --yes @vscode/vsce package --no-dependencies --out "${VSIX_OUT}"

echo ""
echo "✅ Extension built: ${VSIX_OUT}"
echo "   Commit the .vsix and rebuild / reopen the devcontainer."
