# AI Mutation Testing Platform

End-to-end mutation testing platform with:
- FastAPI backend for baseline, mutation generation, execution, and AI-assisted test proposals.
- Next.js web app for dashboard, studio workflow, reports, and preferences.
- VS Code extension for IDE-native mutation testing workflow.

Supports Python, C, and C++ targets with Ollama/OpenAI/mock provider modes.

## What Is In This Repository

- `services/`: backend API and mutation engine integration.
- `agent/`: sample source files and tests used for mutation runs.
- `frontend/`: web app UI.
- `vscode-extension/`: VS Code extension.
- `scripts/`: helper scripts to start/restart backend and web app.
- `mutation_config.yml`: runtime defaults for core service and AI engine.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- VS Code (for extension workflow)
- Optional:
  - Ollama running locally at `http://localhost:11434`
  - OpenAI API key (if using `openai` provider)

## Initial Setup

From repository root:

```powershell
pip install -r requirements.txt
cd frontend
npm install
cd ..\vscode-extension
npm install
cd ..
```

## Running Backend + Web App

### Preferred one-command start

```powershell
npm run dev:web
```

This launches:
- Backend: `http://127.0.0.1:8000`
- Web app: `http://localhost:3000`

### One-command restart (kills listeners on ports and relaunches)

```powershell
npm run dev:restart
```

### Manual start (alternative)

Terminal 1:

```powershell
python services/core_mutation_service.py
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

## Health Check

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8000/health"
```

Expected response includes `status: ONLINE`.

## Web App Usage

Open `http://localhost:3000`.

### 1) Dashboard page

Use this for quick run control and summary charts:
- Configure project wiring (backend URL, workspace directory, target files, AI provider, AI provider URL).
- Run baseline, generate mutants, execute run, propose kill tests.
- Review mutant queue and acceptance/rejection state.

### 2) Studio page (workflow)

Use this for IDE-like flow:
1. `Import Project` to load files into navigator.
2. Review Program Files and Test Files.
3. `Run Baseline`.
4. `Generate Mutants` from imported source selection.
5. Accept/reject mutants in tree.
6. `Execute With Selection`.
7. Inspect editor diff + logs + killed details.

Important behavior:
- Imported project tree is kept in shared app state and remains visible when switching between Studio, Dashboard, Reports, and Preferences (until a new import replaces it).
- Backend execution still runs against `workspaceDir` on disk.

### 3) Preferences page

Mutation Inputs section includes configurable:
- AI Provider (for example: `ollama`, `openai`, `mock`)
- AI Provider URL (for example Ollama host or OpenAI-compatible base URL)

Those values are sent with generation and test proposal requests.

## VS Code Extension Usage

The extension is located in `vscode-extension/`.

### Run extension in development host

1. Open `vscode-extension/` in VS Code.
2. Install dependencies:

```powershell
cd vscode-extension
npm install
```

3. Press `F5` to launch Extension Development Host.
4. In the development host, open this repository as the workspace folder.

### Configure extension

In VS Code settings:
- `mutationTesting.coreServiceUrl` (default `http://127.0.0.1:8000`)
- `mutationTesting.aiProvider` (`openai`, `ollama`, or `mock`)

### Main extension commands

- `Run Baseline Tests`
- `Scan & Generate Mutants`
- `Execute Mutation Run`
- `Open Live Observability Dashboard`
- `Generate Mutation Report`
- `Clear Mutation Data`
- `Propose Test to Kill Survivor`

The Mutation Explorer tree view is available in the activity bar container `Mutation Testing`.

## API Endpoints (Core)

- `GET /health`
- `POST /api/v1/projects/{projectId}/test-runs/baseline`
- `POST /api/v1/projects/{projectId}/test-runs/baseline/start`
- `GET /api/v1/projects/{projectId}/test-runs/baseline/{runId}/status`
- `POST /api/v1/projects/{projectId}/mutations/generate`
- `POST /api/v1/projects/{projectId}/test-runs`
- `GET /api/v1/projects/{projectId}/test-runs/{runId}/status`
- `POST /api/v1/projects/{projectId}/tests/generate`
- `POST /api/v1/projects/{projectId}/mutations/{mutantId}/accept`
- `POST /api/v1/projects/{projectId}/mutations/{mutantId}/reject`
- `POST /api/v1/projects/{projectId}/reset`

## AI Provider Notes

- Default provider configuration is in `mutation_config.yml`.
- Ollama defaults to `http://localhost:11434` unless overridden by request/provider URL.
- If provider is `openai`, ensure your API key env var is set (for example `OPENAI_API_KEY`).

## Troubleshooting

### 404 or stale behavior after code changes

- Restart both services:

```powershell
npm run dev:restart
```

- Hard refresh browser (`Ctrl+F5`).

### Mutants not generating

- Verify backend health endpoint.
- Confirm target files exist under `workspaceDir`.
- Ensure imported files in Studio include valid source extensions (`.py`, `.c`, `.cpp`, `.h`, etc.).

### Extension cannot connect to backend

- Check `mutationTesting.coreServiceUrl` setting.
- Confirm backend is listening on port `8000`.

## Optional: Docker Compose / Observability

The repository includes `docker-compose.yml` and Prometheus/Grafana configs under `services/` for observability-driven setups.

## Quick Validation Flow

1. Start services: `npm run dev:restart`
2. Open web app at `http://localhost:3000`
3. In Studio: Import project -> Run Baseline -> Generate Mutants -> Execute With Selection
4. In VS Code extension: Run Baseline Tests -> Scan & Generate Mutants -> Execute Mutation Run

Both clients use the same backend and can be used side by side.

