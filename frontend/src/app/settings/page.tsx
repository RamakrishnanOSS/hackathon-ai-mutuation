"use client";

import { AppShell } from "@/components/app-shell";
import { useMutationStore } from "@/store/mutation-store";
import { PlatformPreferenceProfile } from "@/lib/framework-interfaces";

export default function SettingsPage() {
  const {
    backendUrl,
    workspaceDir,
    targetFilesInput,
    testFile,
    aiEngineProvider,
    aiProviderUrl,
    mutationGeneratorFramework,
    testExecutorFramework,
    mutationAdapterId,
    testExecutorAdapterId,
    setBackendUrl,
    setWorkspaceDir,
    setTargetFilesInput,
    setTestFile,
    setAiEngineProvider,
    setAiProviderUrl,
    setMutationGeneratorFramework,
    setTestExecutorFramework,
    setMutationAdapterId,
    setTestExecutorAdapterId,
    checkHealth,
  } = useMutationStore();

  const preferenceSnapshot: PlatformPreferenceProfile = {
    mutationGeneratorFramework,
    testExecutorFramework,
    mutationAdapterId,
    testExecutorAdapterId,
    aiProvider: aiEngineProvider,
    aiProviderUrl,
    defaultOperators: [],
  };

  return (
    <AppShell
      title="Preference Center"
      subtitle="Configure pluggable mutation generation and test execution frameworks for future extension compatibility."
      rightContent={<button className="btn-main" onClick={checkHealth}>Check Health</button>}
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass-panel neon-edge flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Connection</h2>
          <label className="field-label">
            Backend URL
            <input className="field-input" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
          </label>
          <label className="field-label">
            Workspace Directory
            <input className="field-input" value={workspaceDir} onChange={(e) => setWorkspaceDir(e.target.value)} />
          </label>
        </div>

        <div className="glass-panel neon-edge flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Mutation Inputs</h2>
          <label className="field-label">
            Target Files CSV
            <input className="field-input" value={targetFilesInput} onChange={(e) => setTargetFilesInput(e.target.value)} />
          </label>
          <label className="field-label">
            Test File
            <input className="field-input" value={testFile} onChange={(e) => setTestFile(e.target.value)} />
          </label>
          <label className="field-label">
            AI Provider
            <input className="field-input" value={aiEngineProvider} onChange={(e) => setAiEngineProvider(e.target.value)} />
          </label>
          <label className="field-label">
            AI Provider URL (Ollama/OpenAI Base URL)
            <input className="field-input" value={aiProviderUrl} onChange={(e) => setAiProviderUrl(e.target.value)} />
          </label>
        </div>

        <div className="glass-panel neon-edge flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Framework Selection</h2>
          <label className="field-label">
            Mutation Generator Framework
            <select className="field-input" value={mutationGeneratorFramework} onChange={(e) => setMutationGeneratorFramework(e.target.value)}>
              <option value="builtin-ast">Built-in AST Generator</option>
              <option value="treesitter-adapter">Tree-sitter Adapter</option>
              <option value="external-mutation-sdk">External Mutation SDK</option>
            </select>
          </label>
          <label className="field-label">
            Test Executor Framework
            <select className="field-input" value={testExecutorFramework} onChange={(e) => setTestExecutorFramework(e.target.value)}>
              <option value="pytest/gtest">Pytest + GTest Hybrid</option>
              <option value="pytest-only">Pytest Only</option>
              <option value="custom-executor">Custom Executor Adapter</option>
            </select>
          </label>
          <label className="field-label">
            Mutation Adapter ID
            <input className="field-input" value={mutationAdapterId} onChange={(e) => setMutationAdapterId(e.target.value)} />
          </label>
          <label className="field-label">
            Test Executor Adapter ID
            <input className="field-input" value={testExecutorAdapterId} onChange={(e) => setTestExecutorAdapterId(e.target.value)} />
          </label>
        </div>

        <div className="glass-panel neon-edge flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Adapter Contract Snapshot</h2>
          <p className="text-sm text-slate-300">
            This profile maps to standardized adapter interfaces in <span className="text-cyan-200">framework-interfaces.ts</span>.
          </p>
          <pre className="code-pane-small">{JSON.stringify(preferenceSnapshot, null, 2)}</pre>
        </div>
      </section>

      <section className="glass-panel neon-edge">
        <h2 className="text-lg font-bold text-white">Standardized Adapter Interfaces</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          <li>Mutation generators should implement: generate(request) and advertise supported languages/capabilities.</li>
          <li>Test executors should implement: execute(request) and support regex or explicit test-file selection when possible.</li>
          <li>Adapters should produce normalized result contracts (KILLED/SURVIVED/TIMEOUT/ERROR) for consistent UI behavior.</li>
          <li>Keep adapter IDs stable for future plugin registry lookup and compatibility checks.</li>
        </ul>
      </section>
    </AppShell>
  );
}
