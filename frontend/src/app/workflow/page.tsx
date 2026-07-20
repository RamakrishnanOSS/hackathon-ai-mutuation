"use client";

import { AppShell } from "@/components/app-shell";
import { useMutationStore } from "@/store/mutation-store";
import { ChangeEvent, useMemo, useRef, useState } from "react";

type BottomTab = "tests" | "mutants" | "killed" | "console";

type NavigatorNode =
  | { kind: "file"; path: string }
  | { kind: "test"; path: string }
  | { kind: "mutant"; id: string }
  | null;

function isTextCodeFile(path: string): boolean {
  const lower = path.toLowerCase();
  return [".py", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".txt", ".md"].some((ext) => lower.endsWith(ext));
}

function isMutationTargetFile(path: string): boolean {
  const lower = path.toLowerCase();
  return [".py", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"].some((ext) => lower.endsWith(ext));
}

function isExcludedMutationPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  const fileName = normalized.split("/").pop() || normalized;

  // Exclude orchestration/runtime scripts and harness files that are not useful mutation targets in UI mode.
  if (["run_agents.py", "run_all.py", "conftest.py"].includes(fileName)) {
    return true;
  }

  return false;
}

function isLikelyTestFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes("test") || lower.includes("spec") || lower.includes("conftest");
}

function StatusPill({ value }: { value: string }) {
  const cls =
    value === "KILLED"
      ? "bg-emerald-500/20 text-emerald-200"
      : value === "SURVIVED"
        ? "bg-rose-500/20 text-rose-200"
        : value === "PENDING"
          ? "bg-amber-500/20 text-amber-200"
          : "bg-slate-500/20 text-slate-200";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>{value}</span>;
}

function executionPhaseIcon(phase?: string): string {
  if (phase === "completed") {
    return "✅";
  }
  if (phase === "error") {
    return "❌";
  }
  if (phase === "running") {
    return "⏳";
  }
  return "🕒";
}

export default function WorkflowPage() {
  const {
    baselineStatus,
    baselineProgress,
    generationStatus,
    executionStatus,
    baselineTests,
    mutants,
    runResults,
    runLogs,
    runProgress,
    selectedMutantId,
    previewOriginal,
    previewMutated,
    errorMessage,
    runBaselinePhase,
    generateMutationsPhase,
    executeRunPhase,
    previewMutant,
    toggleMutantAcceptance,
    setAllMutantsAcceptance,
    setTargetFilesInput,
    importedProjectFiles,
    selectedTestFiles,
    setImportedProjectFiles,
    setSelectedTestFiles,
  } = useMutationStore();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeNode, setActiveNode] = useState<NavigatorNode>(null);
  const [testRegex, setTestRegex] = useState("");
  const [regexError, setRegexError] = useState<string | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>("tests");
  const [executionSelectionSummary, setExecutionSelectionSummary] = useState("No selection applied yet.");
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [collapsedMutantFiles, setCollapsedMutantFiles] = useState<Record<string, boolean>>({});
  const [collapsedNavigatorSections, setCollapsedNavigatorSections] = useState({
    program: false,
    tests: false,
    generated: false,
  });

  function pushLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 250));
  }

  function formatRunLogLine(entry: {
    timestamp: string;
    level: string;
    source: string;
    message: string;
    mutantId?: string | null;
    testName?: string | null;
    framework?: string | null;
    synthetic?: boolean;
  }): string {
    const dt = new Date(entry.timestamp);
    const ts = Number.isNaN(dt.getTime()) ? entry.timestamp : dt.toLocaleTimeString();
    const parts = [
      `[${ts}]`,
      `[${entry.level}]`,
      `[${entry.source}]`,
      entry.framework ? `[${entry.framework}]` : "",
      entry.mutantId ? `[mutant:${entry.mutantId}]` : "",
      entry.testName ? `[test:${entry.testName}]` : "",
      entry.synthetic ? "[synthetic-feed]" : "",
      entry.message,
    ].filter(Boolean);
    return parts.join(" ");
  }

  const combinedConsoleLogs = useMemo(() => {
    const backendLines = (runLogs ?? []).map((entry) => formatRunLogLine(entry));
    return [...backendLines.reverse(), ...activityLogs].slice(0, 400);
  }, [runLogs, activityLogs]);

  const programFiles = useMemo(() => importedProjectFiles.filter((f) => !f.isTest), [importedProjectFiles]);
  const testFiles = useMemo(() => importedProjectFiles.filter((f) => f.isTest), [importedProjectFiles]);

  const selectedMutant = mutants.find((m) => m.mutant_id === selectedMutantId);
  const acceptedMutantCount = mutants.filter((m) => m.accepted !== false).length;
  const rejectedMutantCount = mutants.length - acceptedMutantCount;
  const mutantsByFile = useMemo(() => {
    const grouped = new Map<string, typeof mutants>();
    for (const mutant of mutants) {
      const key = mutant.file_path || "unknown";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(mutant);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([filePath, items]) => ({
        filePath,
        mutants: [...items].sort((a, b) => {
          if (a.line_number !== b.line_number) {
            return a.line_number - b.line_number;
          }
          return a.mutant_id.localeCompare(b.mutant_id);
        }),
      }));
  }, [mutants]);

  function toggleMutantFileCollapse(filePath: string) {
    setCollapsedMutantFiles((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  }

  function setAllMutantFileCollapse(collapsed: boolean) {
    const next: Record<string, boolean> = {};
    for (const group of mutantsByFile) {
      next[group.filePath] = collapsed;
    }
    setCollapsedMutantFiles(next);
  }

  function toggleNavigatorSection(section: "program" | "tests" | "generated") {
    setCollapsedNavigatorSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  const selectedFile = useMemo(() => {
    if (!activeNode || (activeNode.kind !== "file" && activeNode.kind !== "test")) {
      return null;
    }
    return importedProjectFiles.find((f) => f.path === activeNode.path) ?? null;
  }, [activeNode, importedProjectFiles]);

  const diffRows = useMemo(() => {
    const originalLines = (previewOriginal || "").split("\n");
    const mutatedLines = (previewMutated || "").split("\n");
    const maxLen = Math.max(originalLines.length, mutatedLines.length);
    return Array.from({ length: maxLen }, (_, idx) => {
      const left = originalLines[idx] ?? "";
      const right = mutatedLines[idx] ?? "";
      return {
        line: idx + 1,
        left,
        right,
        changed: left !== right,
      };
    });
  }, [previewOriginal, previewMutated]);

  const killedDetails = runResults.filter((r) => r.status === "KILLED");

  async function onImportProject(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const loaded = await Promise.all(
      files
        .filter((f) => isTextCodeFile(f.name) || isTextCodeFile(f.webkitRelativePath || f.name))
        .map(async (file) => {
          const relative = file.webkitRelativePath || file.name;
          const content = await file.text();
          return {
            path: relative,
            content,
            isTest: isLikelyTestFile(relative),
          };
        }),
    );

    const uniqueLoaded = Array.from(new Map(loaded.map((item) => [item.path, item])).values());

    setImportedProjectFiles(uniqueLoaded);
    setSelectedTestFiles(uniqueLoaded.filter((f) => f.isTest).map((f) => f.path));
    pushLog(`Imported ${uniqueLoaded.length} files (${uniqueLoaded.filter((f) => f.isTest).length} tests).`);
    if (uniqueLoaded.length) {
      const first = uniqueLoaded[0];
      setActiveNode({ kind: first.isTest ? "test" : "file", path: first.path });
      pushLog(`Opened ${first.path} in editor.`);
    }
  }

  function applyRegexSelection() {
    if (!testRegex.trim()) {
      setRegexError(null);
      return;
    }
    try {
      const regex = new RegExp(testRegex, "i");
      const matched = testFiles.filter((f) => regex.test(f.path)).map((f) => f.path);
      setSelectedTestFiles(matched);
      setRegexError(null);
      pushLog(`Applied test regex. Matched ${matched.length} test file(s).`);
    } catch {
      setRegexError("Invalid regular expression.");
      pushLog("Regex error: invalid regular expression.");
    }
  }

  async function onGenerateMutants() {
    pushLog("Generate mutants invoked.");
    const allProgramPaths = programFiles.map((f) => f.path);
    const excludedByType = allProgramPaths.filter((p) => !isMutationTargetFile(p));
    const candidateTargets = allProgramPaths.filter((p) => isMutationTargetFile(p));
    const excludedByPath = candidateTargets.filter((p) => isExcludedMutationPath(p));
    const mutationTargets = candidateTargets.filter((p) => !isExcludedMutationPath(p));

    if (!mutationTargets.length) {
      pushLog("Generation aborted: no valid source files (.py/.c/.cpp/.h) found in imported program files.");
      return;
    }

    const skipped = excludedByType.length + excludedByPath.length;
    setTargetFilesInput(mutationTargets.join(","));
    pushLog(`Target source files set from navigator: ${mutationTargets.length}${skipped ? ` (skipped ${skipped} non-source files)` : ""}.`);
    pushLog(`Generation targets: ${mutationTargets.join(", ")}`);
    if (excludedByPath.length) {
      pushLog(`Skipped non-target files in UI mode: ${excludedByPath.join(", ")}`);
    }

    const startedAt = Date.now();
    const heartbeat = window.setInterval(() => {
      const state = useMutationStore.getState();
      if (state.generationStatus !== "running") {
        return;
      }
      const elapsedSec = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      pushLog(
        `Generation running: ${elapsedSec}s elapsed; current visible mutants: ${state.mutants.length}; waiting for backend response...`,
      );
    }, 10000);

    try {
      pushLog("Submitting mutation generation request to backend...");
      await generateMutationsPhase();
    } finally {
      window.clearInterval(heartbeat);
    }

    const postGenerationState = useMutationStore.getState();
    const generated = postGenerationState.mutants;
    const totalSec = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    if (postGenerationState.generationStatus !== "success") {
      const err = postGenerationState.errorMessage || "unknown error";
      pushLog(`Generation failed after ${totalSec}s: ${err}`);
      if (err.toLowerCase().includes("timed out")) {
        pushLog("Hint: backend may be stuck/busy. Restart backend service and retry generation.");
      }
      return;
    }

    if (generated.length > 0) {
      const first = generated[0];
      setActiveNode({ kind: "mutant", id: first.mutant_id });
      pushLog(`Generated ${generated.length} mutants in ${totalSec}s. Focused ${first.mutant_id} in navigator.`);
    } else {
      pushLog(`Generation completed in ${totalSec}s with zero mutants for current selection.`);
    }
  }

  async function onRunBaseline() {
    pushLog("Baseline execution invoked.");
    await runBaselinePhase();
  }

  async function onExecuteWithSelection() {
    const acceptedCount = useMutationStore
      .getState()
      .mutants.filter((m) => m.accepted !== false).length;
    const summary = `Selected tests: ${selectedTestFiles.length}; accepted mutants: ${acceptedCount}; regex: ${testRegex || "(none)"}`;
    setExecutionSelectionSummary(summary);
    pushLog(`Execute invoked. ${summary}`);
    await executeRunPhase();
    setBottomTab("killed");
  }

  return (
    <AppShell
      title="🧬 Mutation Studio"
      subtitle="IDE-style navigator + editor + execution telemetry for mutation testing workflows."
      rightContent={
        <div className="text-xs text-slate-200">
          <p>🧪 Baseline: {baselineStatus}</p>
          <p>
            📈 Baseline Progress: {baselineProgress.completedSuites}/{baselineProgress.totalSuites} ({baselineProgress.phase})
          </p>
          <p>⚙️ Baseline Current: {baselineProgress.currentFramework || "N/A"}</p>
          <p className="max-w-[320px] truncate">💬 Baseline Msg: {baselineProgress.message || "N/A"}</p>
          <p>🧪 Generation: {generationStatus}</p>
          <p>🚀 Execution: {executionStatus}</p>
        </div>
      }
    >
      <section className="studio-grid-2x2">
        <aside className="glass-panel neon-edge studio-nav-panel">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">🗂️ Navigator</h2>
            <button className="btn-main" onClick={() => inputRef.current?.click()}>
              📥 Import Project
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onImportProject}
              {...({ webkitdirectory: "true", directory: "" } as Record<string, string>)}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div>
              <button className="navigator-section-title w-full text-left" onClick={() => toggleNavigatorSection("program")}>
                📄 Program Files {collapsedNavigatorSections.program ? "▸" : "▾"}
              </button>
              {!collapsedNavigatorSections.program ? (
                <div className="navigator-list">
                  {programFiles.map((file, idx) => (
                    <button
                      key={`program-${file.path}-${idx}`}
                      className={`navigator-item ${activeNode?.kind === "file" && activeNode.path === file.path ? "navigator-item-active" : ""}`}
                      onClick={() => setActiveNode({ kind: "file", path: file.path })}
                    >
                      {file.path}
                    </button>
                  ))}
                  {!programFiles.length ? <p className="navigator-empty">No program files imported.</p> : null}
                </div>
              ) : null}
            </div>

            <div>
              <button className="navigator-section-title w-full text-left" onClick={() => toggleNavigatorSection("tests")}>
                🧪 Test Files {collapsedNavigatorSections.tests ? "▸" : "▾"}
              </button>
              {!collapsedNavigatorSections.tests ? (
                <div className="navigator-list">
                  {testFiles.map((file, idx) => {
                    const checked = selectedTestFiles.includes(file.path);
                    return (
                      <label key={`test-${file.path}-${idx}`} className="navigator-item-flex">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTestFiles((prev) => [...new Set([...prev, file.path])]);
                              pushLog(`Selected test file: ${file.path}`);
                            } else {
                              setSelectedTestFiles((prev) => prev.filter((x) => x !== file.path));
                              pushLog(`Deselected test file: ${file.path}`);
                            }
                          }}
                        />
                        <button
                          className={`navigator-item flex-1 text-left ${activeNode?.kind === "test" && activeNode.path === file.path ? "navigator-item-active" : ""}`}
                          onClick={() => setActiveNode({ kind: "test", path: file.path })}
                        >
                          {file.path}
                        </button>
                      </label>
                    );
                  })}
                  {!testFiles.length ? <p className="navigator-empty">No test files imported.</p> : null}
                </div>
              ) : null}
            </div>

            <div className="generated-mutants-section flex min-h-0 flex-1 flex-col">
              <button className="navigator-section-title w-full text-left" onClick={() => toggleNavigatorSection("generated")}>
                🧬 Generated Mutants {collapsedNavigatorSections.generated ? "▸" : "▾"}
              </button>
              {!collapsedNavigatorSections.generated ? (
                <>
              <div className="mb-2 flex items-center gap-2 text-xs">
                <button
                  className="btn-outline"
                  disabled={!mutantsByFile.length}
                  onClick={() => setAllMutantFileCollapse(false)}
                >
                  Expand All
                </button>
                <button
                  className="btn-outline"
                  disabled={!mutantsByFile.length}
                  onClick={() => setAllMutantFileCollapse(true)}
                >
                  Collapse All
                </button>
              </div>
              <div className="navigator-list navigator-list-fill generated-mutants-list">
                {mutantsByFile.map((group) => (
                  <div key={`file-group-${group.filePath}`} className="rounded-md border border-slate-800/70 bg-slate-950/40 p-1">
                    <button
                      className="flex w-full items-center justify-between px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-200"
                      onClick={() => toggleMutantFileCollapse(group.filePath)}
                    >
                      <span>📄 {group.filePath} ({group.mutants.length})</span>
                      <span>{collapsedMutantFiles[group.filePath] ? "▸" : "▾"}</span>
                    </button>
                    {!collapsedMutantFiles[group.filePath] ? (
                      <div className="space-y-1 pl-2">
                        {group.mutants.map((m, idx) => (
                          <button
                            key={`mutant-nav-${m.mutant_id}-${m.file_path}-${m.line_number}-${idx}`}
                            className={`navigator-item ${activeNode?.kind === "mutant" && activeNode.id === m.mutant_id ? "navigator-item-active" : ""}`}
                            onClick={() => {
                              setActiveNode({ kind: "mutant", id: m.mutant_id });
                              pushLog(`Selected mutant ${m.mutant_id} for preview.`);
                              void previewMutant(m.mutant_id);
                            }}
                          >
                            {m.accepted !== false ? "✅ Accepted" : "❌ Rejected"} | {m.mutant_id} (L{m.line_number})
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!mutants.length ? <p className="navigator-empty">No mutants generated yet.</p> : null}
              </div>
              <div className="mt-2 rounded-md border border-slate-800/70 bg-slate-950/50 p-2 text-xs text-slate-200">
                <p className="mb-2 font-semibold text-cyan-200">Selection Mode</p>
                <label className="mr-4 inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="studio-mutant-selection-mode"
                    checked={mutants.length > 0 && acceptedMutantCount === mutants.length}
                    onChange={() => {
                      setAllMutantsAcceptance(true);
                      pushLog(`Selected all mutants (${mutants.length}) from tree controls.`);
                    }}
                    disabled={!mutants.length}
                  />
                  Select All
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="studio-mutant-selection-mode"
                    checked={mutants.length > 0 && rejectedMutantCount === mutants.length}
                    onChange={() => {
                      setAllMutantsAcceptance(false);
                      pushLog(`Unselected all mutants (${mutants.length}) from tree controls.`);
                    }}
                    disabled={!mutants.length}
                  />
                  Unselect All
                </label>
              </div>
                </>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="glass-panel neon-edge studio-action-panel">
          <h2 className="mb-3 text-lg font-bold text-white">⚡ Actions</h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button className="btn-main" onClick={onRunBaseline} disabled={baselineStatus === "running"}>🧪 Run Baseline</button>
            <button className="btn-main" onClick={onGenerateMutants} disabled={generationStatus === "running"}>🧬 Generate Mutants</button>
            <button className="btn-main" onClick={onExecuteWithSelection} disabled={executionStatus === "running"}>🚀 Execute With Selection</button>
            <button className="btn-outline" onClick={applyRegexSelection}>🔎 Apply Test Regex</button>
            <input
              className="field-input min-w-[220px] max-w-[380px] flex-1"
              placeholder="Regex for test-file picking"
              value={testRegex}
              onChange={(e) => setTestRegex(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-300">🎯 Execution selection: {executionSelectionSummary}</p>
          <p className="text-xs text-slate-300">
            🧬 Mutant selection: accepted {acceptedMutantCount} / {mutants.length}, rejected {rejectedMutantCount}
          </p>
          {regexError ? <p className="mt-1 text-xs text-rose-300">{regexError}</p> : null}
          {errorMessage ? <p className="mt-1 text-xs text-rose-300">{errorMessage}</p> : null}
        </section>

        <section className="glass-panel neon-edge studio-editor-panel">
          <h2 className="mb-3 text-lg font-bold text-white">📝 Editor Area</h2>
          {activeNode?.kind === "file" || activeNode?.kind === "test" ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-cyan-200">{selectedFile?.path}</p>
              <pre className="code-pane studio-editor-code">{selectedFile?.content || "No content loaded."}</pre>
            </div>
          ) : activeNode?.kind === "mutant" ? (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  className="btn-main"
                  disabled={!selectedMutant}
                  onClick={() => {
                    if (selectedMutant) {
                      pushLog(`Accept mutation invoked: ${selectedMutant.mutant_id}`);
                      void toggleMutantAcceptance(selectedMutant.mutant_id, true);
                    }
                  }}
                >
                  ✅ Accept Mutation
                </button>
                <button
                  className="btn-outline"
                  disabled={!selectedMutant}
                  onClick={() => {
                    if (selectedMutant) {
                      pushLog(`Reject mutation invoked: ${selectedMutant.mutant_id}`);
                      void toggleMutantAcceptance(selectedMutant.mutant_id, false);
                    }
                  }}
                >
                  ❌ Reject Mutation
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md border border-slate-700/70 bg-slate-950/75 p-2">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-cyan-200">Original</p>
                  <div className="max-h-[360px] overflow-auto font-mono text-xs">
                    {diffRows.map((row) => (
                      <div key={`left-${row.line}`} className={row.changed ? "diff-row diff-row-removed" : "diff-row"}>
                        <span className="diff-line-no">{row.line}</span>
                        <span className="diff-code">{row.left || " "}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-slate-700/70 bg-slate-950/75 p-2">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-fuchsia-200">Mutated</p>
                  <div className="max-h-[360px] overflow-auto font-mono text-xs">
                    {diffRows.map((row) => (
                      <div key={`right-${row.line}`} className={row.changed ? "diff-row diff-row-added" : "diff-row"}>
                        <span className="diff-line-no">{row.line}</span>
                        <span className="diff-code">{row.right || " "}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">Select a file, test, or mutant from the navigator to view content.</p>
          )}
        </section>

        <section className="glass-panel neon-edge studio-status-panel">
        <div className="mb-3 flex flex-wrap gap-2">
          <button className={bottomTab === "tests" ? "chip-active" : "chip"} onClick={() => setBottomTab("tests")}>🧪 Test Execution Status</button>
          <button className={bottomTab === "mutants" ? "chip-active" : "chip"} onClick={() => setBottomTab("mutants")}>🧬 Mutant Status</button>
          <button className={bottomTab === "killed" ? "chip-active" : "chip"} onClick={() => setBottomTab("killed")}>💀 Killed Tests Details</button>
          <button className={bottomTab === "console" ? "chip-active" : "chip"} onClick={() => setBottomTab("console")}>📜 Console</button>
        </div>

        {bottomTab === "tests" ? (
          <div className="space-y-2 text-sm text-slate-100">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">🧪 Selected test files for execution</p>
            <div className="rounded-md border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-200">
              <p>{executionPhaseIcon(runProgress.phase)} Execution phase: {runProgress.phase || "queued"}</p>
              <p>📌 Execution status: {executionStatus}</p>
              <p>📈 Mutant progress: {runProgress.completedMutants}/{runProgress.totalMutants}</p>
            </div>
            <div className="max-h-[120px] overflow-auto rounded-md border border-slate-700/70 bg-slate-950/60 p-2 text-xs">
              {selectedTestFiles.map((path) => (
                <p key={path}>{path}</p>
              ))}
              {!selectedTestFiles.length ? <p>No test files selected.</p> : null}
            </div>
            <p className="text-xs text-slate-300">🔎 Regex: {testRegex || "(none)"}</p>
            <div className="max-h-[180px] overflow-auto rounded-md border border-slate-700/70 bg-slate-950/60 p-2 text-xs">
              {baselineTests.map((test) => (
                <p key={test.name}>🧪 {test.status} - {test.name}</p>
              ))}
              {!baselineTests.length ? <p>Run baseline to populate per-test status.</p> : null}
            </div>
          </div>
        ) : null}

        {bottomTab === "mutants" ? (
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span>Accepted: {acceptedMutantCount}</span>
              <span>Rejected: {rejectedMutantCount}</span>
            </div>
            <div className="max-h-[280px] overflow-auto">
            <table className="w-full text-sm text-slate-100">
              <thead className="bg-slate-950/90 text-xs uppercase tracking-[0.14em] text-cyan-100">
                <tr>
                  <th className="px-3 py-2 text-left">🧬 Mutant</th>
                  <th className="px-3 py-2 text-left">📌 Status</th>
                  <th className="px-3 py-2 text-left">✅ Acceptance</th>
                </tr>
              </thead>
              <tbody>
                {mutants.map((m, idx) => (
                  <tr key={`mutant-row-${m.mutant_id}-${m.file_path}-${m.line_number}-${idx}`} className="border-t border-slate-800/70">
                    <td className="px-3 py-2">{m.mutant_id}</td>
                    <td className="px-3 py-2"><StatusPill value={m.status || "PENDING"} /></td>
                    <td className="px-3 py-2">{m.accepted !== false ? "✅ ACCEPTED" : "❌ REJECTED"}</td>
                  </tr>
                ))}
                {!mutants.length ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400">No mutants generated yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            </div>
          </div>
        ) : null}

        {bottomTab === "killed" ? (
          <div className="max-h-[280px] space-y-2 overflow-auto">
            {killedDetails.map((item) => (
              <div key={item.mutantId} className="rounded-md border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm">
                <p className="font-semibold text-emerald-200">💀 {item.mutantId}</p>
                <p className="text-xs text-slate-200">🧪 Killing test: {item.killingTest || "N/A"}</p>
                <p className="text-xs text-slate-300">⏱️ Duration: {item.executionDurationMs}ms</p>
              </div>
            ))}
            {!killedDetails.length ? <p className="text-sm text-slate-300">No killed-mutant details available yet.</p> : null}
          </div>
        ) : null}

        {bottomTab === "console" ? (
          <div className="max-h-[280px] space-y-1 overflow-auto rounded-md border border-slate-700/70 bg-slate-950/70 p-3 font-mono text-xs text-cyan-100">
            <div className="mb-2 rounded-md border border-cyan-900/60 bg-cyan-950/40 p-2 text-[11px] text-cyan-200">
              <p>
                {executionPhaseIcon(runProgress.phase)} Run progress: {runProgress.completedMutants}/{runProgress.totalMutants} mutants, phase={runProgress.phase || "queued"}
              </p>
              <p>⚙️ Framework: {runProgress.currentFramework || "N/A"}</p>
              <p>🧬 Current mutant: {runProgress.currentMutantId || "N/A"}</p>
              <p>🧪 Current test: {runProgress.currentTestName || "N/A"}</p>
            </div>
            {combinedConsoleLogs.map((line, idx) => (
              <p key={`${idx}-${line}`}>{line}</p>
            ))}
            {!combinedConsoleLogs.length ? <p>No activity logs yet. Actions will stream here.</p> : null}
          </div>
        ) : null}
      </section>
      </section>
    </AppShell>
  );
}
