# VS Code Extension Update: Project Mode Support

## Summary of Changes

The AI Mutation Testing VS Code extension has been updated to support **multi-project mutation testing** with explicit project path and build system selection.

## Key Updates

### 1. **Added Project Context Variables**
```typescript
let projectPath: string = "";
let buildSystem: string = "auto";
```

These variables store the user's selected project path and build system for use across all mutation testing commands.

### 2. **Enhanced Configuration Wizard (5 Steps)**

**Step 0: Project Selection** (NEW)
- **Python Project (py-src)** — Pre-configured Python project with pytest
- **C/C++ Project (c-src)** — Pre-configured C/C++ project with CMake
- **Custom Project Path** — User can specify any project directory

When selected:
- Pre-built projects: Uses `<workspace>/py-src` or `<workspace>/c-src`
- Custom path: User enters absolute or relative path

**Steps 1-4** (Updated numbering)
1. Mutation Operator Types (unchanged)
2. Developer Instructions (unchanged)
3. Focus Area (unchanged)
4. Test Strategy (unchanged)

### 3. **Updated API Requests**

#### Before
```typescript
const resp = await makePostRequest(`${backendUrl}/api/v1/projects/default/test-runs/baseline`, {
  workspaceDir: wsDir,
  testRunner: runnerType
});
```

#### After
```typescript
const resp = await makePostRequest(`${backendUrl}/api/v1/projects/default/test-runs/baseline`, {
  projectPath: activeProjectPath,
  buildSystem: buildSystem,
  workspaceDir: wsDir,        // kept for backward compatibility
  testRunner: runnerType
});
```

**Same updates applied to:**
- `mutation.runBaseline` command
- `mutation.generate` command

### 4. **Backward Compatibility**

✅ `workspaceDir` parameter still sent for backward compatibility  
✅ If no project selected, defaults to workspace root  
✅ Existing deployments continue to work  

## Files Modified

- `vscode-extension/src/extension.ts`
  - Added `projectPath` and `buildSystem` global variables
  - Added Step 0 (Project Selection) to `configureMutationFlow` command
  - Updated `runBaseline` command to use new parameters
  - Updated `generate` command to use new parameters
  - Updated output logging to show project and build system info

## How It Works

### User Workflow

1. **Open project-sources folder** in VS Code
   ```bash
   code project-sources
   ```

2. **Reopen in Container** (if using devcontainer)

3. **Configure Mutation Context**
   - Extension shows Project Selection UI
   - User chooses: Python (py-src), C/C++ (c-src), or Custom
   - Wizard continues with operators, instructions, focus, strategy

4. **Run Baseline**
   - Uses selected project path
   - Sends `projectPath` and `buildSystem` to backend
   - Backend auto-detects (CMake or pytest)

5. **Generate Mutations**
   - Uses same project context
   - Discovers source files from selected project
   - Generates mutations with AI guidance

### Example Requests

**Configure py-src project:**
```
Project Selection → Python Project (py-src)
Operators → Select types
Instructions → "Test boundary conditions"
Focus → Edge Cases
Strategy → Branch Coverage

projectPath: /path/to/project-sources/py-src
buildSystem: auto
```

**Backend detects and runs:**
```
BuildSystemFactory.detect(py-src) → "Python (Multi-Framework)"
PythonBuildAdapter.compile() → success
PythonBuildAdapter.run_tests() → 125/125 passed
```

## Benefits

✅ **Unified Project Support** — Single extension handles Python, C/C++, and other projects  
✅ **Explicit Project Selection** — Users control which project to test  
✅ **Build System Auto-Detection** — Backend detects CMake, pytest, etc.  
✅ **Scalability** — Easy to add more projects without code changes  
✅ **Backward Compatible** — Existing deployments unaffected  

## Testing

To test the new functionality:

1. Open `project-sources` folder in VS Code
2. Run "Configure Mutation Context" command
3. Select a project (py-src or c-src)
4. Complete the configuration wizard
5. Run "Run Baseline Tests"
6. Verify project path is used in backend

## Next Steps

- **Phase 5:** End-to-end integration testing
  - Test devcontainer with new extension
  - Run full mutation workflow: baseline → generate → execute
  - Verify metrics collection and Grafana integration

- **Optional Enhancements:**
  - Add "Recent Projects" quick select
  - Save project preference per workspace
  - Visual indicator showing active project
  - Project settings (include/exclude patterns)
