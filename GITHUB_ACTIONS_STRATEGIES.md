# GitHub Actions Workflow Strategies

This project now has **two workflow approaches** you can use depending on your needs.

## Strategy 1: Bare Metal (Current Default)
**File:** `.github/workflows/ai-mutation-testing.yml`

### How It Works
- Runs on `ubuntu-latest` (GitHub-hosted runner)
- Direct package installation via `apt-get` and `pip`
- Uses internal build scripts from `project-sources/scripts/`
- All tests run sequentially

### Pros ✅
- **Fast startup** — No container overhead
- **Better caching** — GitHub Actions caches `apt` and `pip` packages across runs
- **Simple debugging** — Direct access to runner environment
- **Lower resource usage** — Less memory/disk overhead

### Cons ❌
- Environment differences between local (Docker) and CI (bare Ubuntu)
- Slower when dependencies need to be reinstalled
- Each run installs fresh packages

### Performance
```
First run:  ~8-10 minutes (build tools + tests)
Subsequent: ~4-6 minutes (packages cached)
```

### Use This When
- You want the fastest possible CI/CD
- You're not concerned about local vs CI environment consistency
- You want minimal resource overhead

---

## Strategy 2: Containerized (New)
**File:** `.github/workflows/ai-mutation-testing-containerized.yml`

### How It Works
1. **Build step** (once per change):
   - Builds Docker image using `type=gha` (GitHub Actions cache)
   - Stores Docker layers in GitHub's free cache
   - No external registry needed
   
2. **Test steps** (parallel):
   - Runs in the cached Docker container
   - Same environment as local devcontainer
   - Tests can run in parallel (faster overall)

### Pros ✅
- **Consistent environments** — Exact same as local devcontainer
- **Fast subsequent runs** — Docker layers cached, builds are instant
- **Parallel execution** — Tests run simultaneously (C, C++, Python at once)
- **Reproducibility** — Same Dockerfile everywhere (local, CI, prod)
- **No external registry** — Completely internal to GitHub

### Cons ❌
- **Slower first run** — Docker build takes time (~5 min initially)
- **Memory overhead** — Container requires more resources
- **Cache expiration** — Cache expires after 5 days of no use
- **Larger artifact footprint** — Docker layers are bigger than bare deps

### Performance
```
First run (cache miss):  ~12-15 minutes (build image + tests)
Subsequent runs:         ~2-4 minutes (cache hit + tests)
Cached for:             5 days of inactivity
```

### Use This When
- Consistency between local and CI is critical
- You run tests frequently (cache hit beneficial)
- You want parallel test execution
- You prefer reproducible, containerized environments

---

## Comparison Table

| Aspect | Bare Metal | Containerized |
|--------|-----------|---------------|
| **First Run** | 8-10 min | 12-15 min |
| **Cache Hit** | 4-6 min | 2-4 min |
| **Startup Overhead** | Minimal | Docker pull + start |
| **Environment Consistency** | ⚠️ Different | ✅ Same |
| **External Registry** | Not needed | Not needed |
| **Cache Persistence** | Indefinite | 5 days |
| **Parallel Execution** | Sequential | ✅ Parallel |
| **Resource Usage** | Low | Moderate |
| **Dependency Variability** | Medium | Low |

---

## Switching Between Workflows

### Use Bare Metal (Default)
```bash
# This is already configured
# Just push to main/develop and it runs
```

### Switch to Containerized
```bash
# Rename the workflow to activate it
mv .github/workflows/ai-mutation-testing-containerized.yml \
   .github/workflows/ai-mutation-testing.yml

# Disable the old one
mv .github/workflows/ai-mutation-testing.yml \
   .github/workflows/ai-mutation-testing-bare-metal.yml.disabled
```

### Run Both (Optional)
You can keep both enabled to compare. They don't interfere:
- Bare metal: `ai-mutation-testing.yml` (on push/PR)
- Containerized: `ai-mutation-testing-containerized.yml` (on push/PR)

---

## How Docker Caching Works

### GitHub Actions Cache (`type=gha`)

**First Time:**
```
Build step scans Dockerfile → checks cache → cache miss
→ builds image layer by layer → stores in GHA cache
→ test steps run inside container
Time: ~15 minutes
```

**Second Time (within 5 days):**
```
Build step checks cache → cache hit (all layers exist)
→ loads image from cache instantly
→ test steps run inside container
Time: ~2-4 minutes
```

### Cache Invalidation
Cache is invalidated when:
- Dockerfile changes
- Requirements in image change
- 5 days pass since last use
- Manual cleanup via "Clear all caches"

---

## Dockerfile Optimization Tips

The image caching works best when:

1. **Frequently changing layers are last**
   ```dockerfile
   # Frequently changes → put later
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   # Rarely changes → put earlier
   RUN apt-get update && apt-get install -y gcc g++
   ```

2. **Minimize layer count**
   - Combine RUN commands: `RUN cmd1 && cmd2 && cmd3`
   - Remove unnecessary intermediate images

3. **Use `.dockerignore`**
   ```
   .git
   .gitignore
   node_modules
   __pycache__
   *.pyc
   .venv
   ```

---

## Monitoring Cache Usage

### Check Cache Size
```bash
# In GitHub Settings → Actions → General
# Shows cache usage and cleanup options
```

### See Cache Hits in Workflow Logs
When using `docker/build-push-action@v5` with `type=gha`, look for:
```
cache-from type=gha   ← Reading from cache
cache-to type=gha     ← Writing to cache
```

---

## Recommendation

### For Development Teams
**Use Containerized** (`ai-mutation-testing-containerized.yml`):
- Consistency is important
- Parallel tests save time overall
- Cache will be hit frequently

### For Quick Feedback on Single PR
**Use Bare Metal** (`ai-mutation-testing.yml`):
- Faster initial setup
- No cache expiration concerns
- Simpler to debug

### For Production
**Use Containerized** + Manual Build:
- Deterministic, reproducible builds
- Exact same environment everywhere
- Better for long-term maintenance

---

## Troubleshooting

### Cache Not Working?
```bash
# Check if cache is enabled in repository settings
Settings → Actions → General → "Artifacts and logs retention"

# Manual cache cleanup
Settings → Actions → Caches → Clear all caches
```

### Docker Image Not Found?
```bash
# The image is built internally, not pushed to registry
# It exists only in GitHub's cache for that workflow
# If cache expired, first build will recreate it
```

### Out of Disk Space?
```bash
# Docker cache takes up space on runner
# GitHub gives 14 GB to workflows
# Cache cleanup happens automatically after 5 days

# If needed, use Docker buildx pruning:
docker buildx prune --all
```

---

## Advanced: Custom Registry

If you want to push to a registry later:

```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- uses: docker/build-push-action@v5
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}/mutation-testing:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

---

## Files

- **`.github/workflows/ai-mutation-testing.yml`** — Bare metal (default)
- **`.github/workflows/ai-mutation-testing-containerized.yml`** — Docker cached
- **`.github/workflows/build-container.yml`** — Daily cache refresh (optional)

**Currently Active:** Bare metal (`ai-mutation-testing.yml`)

---

**Last Updated:** July 20, 2026  
**Maintained By:** GitHub Actions Setup  
**Related:** [BUILD_SCRIPTS_GUIDE.md](BUILD_SCRIPTS_GUIDE.md) · [GITHUB_WORKFLOW_CLEANUP.md](GITHUB_WORKFLOW_CLEANUP.md)
