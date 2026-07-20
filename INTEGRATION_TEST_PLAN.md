# Phase 5: End-to-End Integration Testing Plan

## Objective
Validate complete mutation testing workflow from devcontainer startup through mutation generation, execution, and metrics collection.

## Test Scenarios

### Scenario 1: Python Project (py-src) Full Workflow
**Goal:** Validate Python project mutation testing end-to-end

- [x] Verify py-src project structure
- [ ] Test Python project build (compile)
- [ ] Test Python project tests (baseline)
- [ ] Test mutation generation
- [ ] Test mutation execution
- [ ] Verify metrics collection

### Scenario 2: C/C++ Project (c-src) Full Workflow
**Goal:** Validate C/C++ project mutation testing end-to-end

- [x] Verify c-src project structure
- [ ] Test C/C++ project build (CMake)
- [ ] Test C/C++ project tests (baseline)
- [ ] Test mutation generation
- [ ] Test mutation execution
- [ ] Verify metrics collection

### Scenario 3: Devcontainer Setup
**Goal:** Validate devcontainer launches correctly with new structure

- [ ] Verify devcontainer detects .devcontainer/ from project-sources/
- [ ] Verify all services start (devcontainer + core-service)
- [ ] Verify port forwarding works (8001, 3000, 9090)
- [ ] Verify extension installs automatically

### Scenario 4: Extension Project Selection
**Goal:** Validate extension UI for project selection

- [ ] Extension shows project selection in configuration wizard
- [ ] User can select py-src
- [ ] User can select c-src
- [ ] User can enter custom path
- [ ] Extension sends projectPath to backend

### Scenario 5: API Integration
**Goal:** Validate API endpoints accept and use projectPath parameter

- [ ] Baseline endpoint receives projectPath
- [ ] Generate endpoint receives projectPath
- [ ] Backend uses correct project for build/test operations
- [ ] Backward compatibility maintained (workspaceDir still works)

### Scenario 6: Cross-Project Testing
**Goal:** Validate switching between projects works correctly

- [ ] Configure for py-src, run tests
- [ ] Reconfigure for c-src, run tests
- [ ] Verify metrics don't mix between projects
- [ ] Verify clean state between switches

## Success Criteria

### Overall
- ✅ All phases (1-4) completed and verified
- ✅ No breaking changes to existing functionality
- ✅ Both projects work independently
- ✅ Metrics collected correctly
- ✅ Backward compatibility maintained

### Python Project
- ✅ 125 tests pass baseline
- ✅ Mutations generate successfully
- ✅ Mutation execution works
- ✅ pytest framework detected

### C/C++ Project
- ✅ 2 tests pass baseline
- ✅ Mutations generate successfully
- ✅ Mutation execution works
- ✅ CMake build system detected

### Infrastructure
- ✅ Devcontainer starts without errors
- ✅ All services accessible
- ✅ Extension loads correctly
- ✅ Grafana dashboard shows metrics

## Test Execution Order

1. **Basic Connectivity Tests** (5 min)
   - Verify both projects can be built
   - Verify baseline tests pass

2. **API Integration Tests** (10 min)
   - Test baseline endpoint with projectPath
   - Test generate endpoint with projectPath
   - Verify responses are correct

3. **Extension UI Tests** (5 min)
   - Test project selection dialog
   - Test configuration wizard with each project
   - Verify API calls have projectPath

4. **Workflow Tests** (15 min)
   - Full py-src workflow: configure → baseline → generate → execute
   - Full c-src workflow: configure → baseline → generate → execute
   - Cross-project switching

5. **Metrics & Dashboard Tests** (10 min)
   - Verify Prometheus collects metrics
   - Verify Grafana displays data
   - Check metrics for both projects

## Current Status

✅ Phase 1-4 Complete
⏳ Phase 5 In Progress

## Next Steps

1. Run connectivity validation
2. Test API endpoints
3. Test extension UI
4. Run full workflows
5. Verify metrics and dashboards
6. Document findings and any issues
