#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# install-extension.sh
# Invoked by devcontainer postAttachCommand (runs every time VS Code attaches).
#
# Installs the pre-built .vsix (committed to .devcontainer/) directly into the
# VS Code Server extensions directory — no build step, no CLI dependency.
# A .vsix is a ZIP archive; its extension content lives under extension/.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

VSIX="/workspace/.devcontainer/ai-mutation-testing.vsix"

# Extension identity (must match package.json publisher / name / version)
PUBLISHER="hackathon-ai"
EXT_NAME="ai-mutation-testing"
VERSION="1.0.0"
EXT_ID="${PUBLISHER}.${EXT_NAME}-${VERSION}"

echo "──────────────────────────────────────────────────"
echo "▶ Installing AI Mutation Testing VS Code extension"
echo "──────────────────────────────────────────────────"

if [ ! -f "${VSIX}" ]; then
  echo ""
  echo "⚠️  Pre-built extension not found at ${VSIX}."
  echo "   On the host, run:"
  echo "     bash vscode-extension-scripts/build-extension.sh"
  echo "   then commit the generated .vsix and rebuild the devcontainer."
  exit 0   # non-fatal: don't block the devcontainer from opening
fi

# ── Locate VS Code Server extensions directory ───────────────────────────────
if [ -n "${VSCODE_AGENT_FOLDER:-}" ]; then
  EXT_INSTALL_DIR="${VSCODE_AGENT_FOLDER}/extensions"
else
  EXT_INSTALL_DIR=$(find "${HOME}" -maxdepth 5 \
    -type d -name "extensions" \
    -path "*vscode-server*" 2>/dev/null | head -1)
  if [ -z "${EXT_INSTALL_DIR}" ]; then
    EXT_INSTALL_DIR="${HOME}/.vscode-server/extensions"
  fi
fi

mkdir -p "${EXT_INSTALL_DIR}"
echo "  Extensions directory: ${EXT_INSTALL_DIR}"

# ── Extract VSIX → extensions directory ─────────────────────────────────────
WORK_DIR="/tmp/vsix-install-$$"
mkdir -p "${WORK_DIR}"

echo "  Extracting ${VSIX}..."
python3 - "${VSIX}" "${WORK_DIR}" <<'PYEOF'
import sys, zipfile
vsix_path, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(vsix_path) as z:
    members = [m for m in z.namelist() if m.startswith("extension/")]
    z.extractall(dest, members)
PYEOF

TARGET="${EXT_INSTALL_DIR}/${EXT_ID}"
rm -rf "${TARGET}"
mv "${WORK_DIR}/extension" "${TARGET}"
rm -rf "${WORK_DIR}"

echo ""
echo "✅ Extension installed to:"
echo "   ${TARGET}"
echo ""
echo "   Reload VS Code to activate: Ctrl+Shift+P → Developer: Reload Window"
echo ""
echo "   Available commands:"
echo "   • Mutation: Run Baseline Tests"
echo "   • Mutation: Scan & Generate Mutants"
echo "   • Mutation: Execute Mutation Run"
echo "   • Mutation: Propose Test to Kill Survivor"
echo ""
echo "   Open the Mutation Explorer panel (beaker icon) in the Activity Bar."
