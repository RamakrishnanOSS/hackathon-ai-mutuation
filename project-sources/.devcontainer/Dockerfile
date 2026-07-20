# ─────────────────────────────────────────────────────────────
# AI Mutation Testing — Dev Container Image
# Base: Ubuntu 22.04 devcontainer base (non-root vscode user)
# Bundles: Python 3.11, Node 20, g++/gcc, all pip deps
# Note: extension building happens on the host via
#       vscode-extension-scripts/build-extension.sh.
#       The resulting .vsix is committed to .devcontainer/ and
#       installed at attach time by install-extension.sh.
# ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ARG DEBIAN_FRONTEND=noninteractive

# ── System packages ───────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 \
        python3.11-dev \
        python3.11-venv \
        python3-pip \
        build-essential \
        g++ \
        gcc \
        cmake \
        make \
        git \
        curl \
        jq \
    && rm -rf /var/lib/apt/lists/*

# Canonical python / pip symlinks
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python  python  /usr/bin/python3.11 1 \
    && ln -sf /usr/bin/python3.11 /usr/local/bin/python3 \
    && ln -sf /usr/bin/python3.11 /usr/local/bin/python \
    && python3 -m pip install --upgrade pip setuptools wheel

# ── Node.js 20 (LTS) ─────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Python runtime dependencies (cached layer) ───────────────
# Copy only requirements so this layer is re-used when source changes.
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# ── Non-root user already provided by base image ─────────────
USER vscode
