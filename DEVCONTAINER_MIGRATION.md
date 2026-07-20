# Devcontainer Migration: agent → project-sources

## Migration Summary

The VS Code devcontainer has been moved from `agent/.devcontainer/` to `project-sources/.devcontainer/` to create a unified developer workspace for both C/C++ and Python mutation testing projects.

## New Structure

```
hackathon-ai-mutuation/
├── mutation-engine/              # Backend mutation testing service
│   ├── services/                 # FastAPI app + build system adapters
│   ├── docker-compose.yml        # Standalone services (8000)
│   └── Dockerfile.core           # Core service image
│
├── project-sources/              # 🆕 PRIMARY DEVELOPER WORKSPACE
│   ├── .devcontainer/            # 🆕 Moved from agent/
│   │   ├── Dockerfile            # Custom: Python 3.11, Node 20, CMake
│   │   ├── docker-compose.yml    # Services: devcontainer + core-service (8001)
│   │   ├── devcontainer.json     # VS Code configuration
│   │   ├── install-extension.sh  # Extension installer
│   │   ├── ai-mutation-testing.vsix  # Pre-built extension
│   │   └── devcontainer-lock.json
│   │
│   ├── c-src/                    # C/C++ example project
│   │   ├── CMakeLists.txt
│   │   ├── src/  tests/  include/
│   │   └── ... (2 tests)
│   │
│   ├── py-src/                   # Python example project
│   │   ├── src/  tests/  pyproject.toml
│   │   ├── pytest.ini  setup.cfg
│   │   └── ... (125 tests)
│   │
│   ├── README.md                 # 🆕 Project workspace documentation
│   ├── .gitignore               # 🆕 Build outputs, IDE, cache
│   └── ... (other projects as added)
│
├── agent/                        # Legacy: pytest agent, test files
│   ├── .devcontainer/           # 🚫 DEPRECATED - see DEPRECATED.md
│   ├── requirements.txt
│   └── ... (test utilities)
│
└── ... (other root files)
```

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Devcontainer Location** | `agent/.devcontainer/` | `project-sources/.devcontainer/` |
| **Workspace Root** | `/workspace` = `agent/` | `/workspace` = `project-sources/` |
| **Projects Included** | Python tests only (agent/) | Both C/C++ (c-src/) and Python (py-src/) |
| **docker-compose Mount** | `- ..:/workspace` (agent→/workspace) | `- ..:/workspace` (project-sources→/workspace) |
| **core-service Port** | 8001 (forwarded from 8000) | 8001 (same) |
| **Purpose** | Single test suite | Multiple example projects + tests |

## File Locations

### Devcontainer Files (Migrated)
- ✅ `project-sources/.devcontainer/Dockerfile`
- ✅ `project-sources/.devcontainer/docker-compose.yml` (updated paths)
- ✅ `project-sources/.devcontainer/devcontainer.json` (updated comments)
- ✅ `project-sources/.devcontainer/install-extension.sh`
- ✅ `project-sources/.devcontainer/ai-mutation-testing.vsix`
- ✅ `project-sources/.devcontainer/devcontainer-lock.json`

### New Documentation
- ✅ `project-sources/README.md` — Workspace overview and usage
- ✅ `project-sources/.gitignore` — Build/IDE/cache patterns
- ✅ `agent/.devcontainer/DEPRECATED.md` — Migration notice

### Unchanged Files
- `mutation-engine/docker-compose.yml` — Root services (8000)
- `mutation-engine/Dockerfile.core` — Core service image
- `agent/requirements.txt` — Still used by devcontainer Dockerfile
- `agent/pytest.ini` — Legacy test configuration

## How It Works

### Before (agent-only workspace)
```
Host                    Docker                    Services
  VS Code        →     devcontainer             /workspace = agent/
                           ↓
                      core-service   →   http://localhost:8001
                      prometheus
                      grafana
```

### After (project-sources multi-project workspace)
```
Host                    Docker                    Services
  VS Code        →     devcontainer             /workspace = project-sources/
                       (mounts c-src/ + py-src/)      ↓
                           ↓                    - c-src/  (CMake)
                      core-service   →   - py-src/  (pytest)
                      prometheus              - other projects
                      grafana
```

## Using the New Devcontainer

### Step 1: Open project-sources in VS Code
```bash
# From repo root
code project-sources

# Or open VS Code, then File → Open Folder → project-sources
```

### Step 2: Reopen in Container
- VS Code detects `.devcontainer/devcontainer.json`
- Click "Reopen in Container" when prompted
- Or use Command Palette: `Dev Containers: Reopen in Container`

### Step 3: Work with Projects
```bash
# Inside container (/workspace = project-sources/)
cd c-src
mkdir -p build && cd build && cmake .. && make && ctest

cd ../py-src
python3 -m pytest tests/
```

## Benefits of This Migration

1. **Unified Workspace** — Both C/C++ and Python projects in one folder
2. **Scalability** — Easy to add new project types (Java, Rust, etc.)
3. **Shared Infrastructure** — One devcontainer, one docker-compose
4. **Cleaner Root** — `agent/` no longer polluted with devcontainer
5. **Better Organization** — `project-sources/` clearly indicates developer area
6. **Reduced Complexity** — Single devcontainer entry point for all projects

## Backward Compatibility

| Item | Status | Notes |
|------|--------|-------|
| **agent/ tests** | ✅ Still work | Tests can still run from agent/ via pytest |
| **agent/requirements.txt** | ✅ Still used | Devcontainer Dockerfile copies from repo root |
| **Old devcontainer path** | ⚠️ Deprecated | Documented in `agent/.devcontainer/DEPRECATED.md` |
| **API endpoints** | ✅ Unchanged | Still 8001 from host, 8000 inside container |
| **Build adapters** | ✅ Work | Detect c-src/ and py-src/ automatically |

## Migration Checklist

- ✅ Copy devcontainer files to project-sources/
- ✅ Update docker-compose.yml paths
- ✅ Update devcontainer.json comments
- ✅ Create project-sources/README.md
- ✅ Create project-sources/.gitignore
- ✅ Document deprecation (agent/.devcontainer/DEPRECATED.md)
- ⏳ Next: Delete agent/.devcontainer/ (when fully migrated)
- ⏳ Next: Update any CI/CD references to use project-sources

## Next Steps

1. **Test the new setup:**
   ```bash
   cd project-sources
   # VS Code will prompt to reopen in container
   ```

2. **Verify both projects work:**
   ```bash
   cd /workspace/c-src && ctest -V
   cd /workspace/py-src && pytest tests/
   ```

3. **Run mutation testing:**
   ```bash
   # Use the AI mutation testing extension
   # Or API: curl http://core-service:8000/api/v1/projects
   ```

4. **Optional: Delete old devcontainer**
   ```bash
   rm -rf agent/.devcontainer/
   ```

## Troubleshooting

**VS Code doesn't detect devcontainer?**
- Close all VS Code windows
- Delete `.devcontainer` from agent/ (or rename to avoid confusion)
- Open project-sources/ fresh

**Docker network error?**
- Ensure mutation-net exists: `docker network create mutation-net`
- Or: `docker compose -f mutation-engine/docker-compose.yml up`

**Core service won't start?**
- Check paths: `docker-compose -f project-sources/.devcontainer/docker-compose.yml config`
- Verify mutation-net is external: `docker network ls | grep mutation-net`

**Can't access http://localhost:8001?**
- Ensure core-service is running: `docker ps | grep core-service`
- Check port forwarding: `docker port core-service`
