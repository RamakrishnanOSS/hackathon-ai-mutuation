"use client";

import { motion } from "framer-motion";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Area, AreaChart, XAxis } from "recharts";
import { useMemo, useState } from "react";
import { useMutationStore } from "@/store/mutation-store";
import { AppShell } from "@/components/app-shell";

const OPERATOR_OPTIONS = [
  "relational_operator_replacement",
  "arithmetic_substitution",
  "boundary_value_tweak",
  "boolean_inversion",
  "return_value_stripping",
];

function StatusPill({ value }: { value: string }) {
  const theme =
    value === "success"
      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
      : value === "running"
        ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40"
        : value === "error"
          ? "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40"
          : "bg-slate-500/20 text-slate-200 ring-1 ring-slate-400/40";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${theme}`}>{value}</span>;
}

function MetricCard({ title, value, subLabel }: { title: string; value: string; subLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-panel neon-edge"
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{title}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{subLabel}</p>
    </motion.div>
  );
}

export default function Home() {
  const [collapsedQueueFiles, setCollapsedQueueFiles] = useState<Record<string, boolean>>({});

  const {
    backendUrl,
    workspaceDir,
    targetFilesInput,
    operators,
    aiEngineProvider,
    aiProviderUrl,
    testFile,
    healthStatus,
    baselineStatus,
    generationStatus,
    executionStatus,
    aiProposalStatus,
    baselineTests,
    mutants,
    runResults,
    proposedTests,
    selectedMutantId,
    previewOriginal,
    previewMutated,
    errorMessage,
    setBackendUrl,
    setWorkspaceDir,
    setTargetFilesInput,
    setAiEngineProvider,
    setAiProviderUrl,
    setTestFile,
    setOperators,
    checkHealth,
    runBaselinePhase,
    generateMutationsPhase,
    toggleMutantAcceptance,
    setAllMutantsAcceptance,
    previewMutant,
    executeRunPhase,
    proposeTestsPhase,
    resetAllPhaseData,
  } = useMutationStore();

  const killed = runResults.filter((r) => r.status === "KILLED").length;
  const survived = runResults.filter((r) => r.status === "SURVIVED").length;
  const totalRun = runResults.length;
  const killScore = totalRun ? ((killed / totalRun) * 100).toFixed(1) : "0.0";

  const pieData = useMemo(
    () => [
      { name: "Killed", value: killed },
      { name: "Survived", value: survived },
    ],
    [killed, survived],
  );

  const trendData = useMemo(
    () =>
      runResults.slice(0, 12).map((item, idx) => ({
        run: idx + 1,
        score: item.status === "KILLED" ? 100 : 0,
      })),
    [runResults],
  );

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

  function toggleQueueFileCollapse(filePath: string) {
    setCollapsedQueueFiles((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  }

  function setAllQueueFileCollapse(collapsed: boolean) {
    const next: Record<string, boolean> = {};
    for (const group of mutantsByFile) {
      next[group.filePath] = collapsed;
    }
    setCollapsedQueueFiles(next);
  }

  return (
    <AppShell
      title="Web Mutation Command Center"
      subtitle="Reuses your existing FastAPI engine and mirrors VS Code flow, now upgraded for live demo impact."
      rightContent={
        <div className="flex items-center gap-3">
          <button className="btn-outline" onClick={checkHealth}>
            Check Backend
          </button>
          <span className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider ${healthStatus === "online" ? "bg-emerald-500/20 text-emerald-200" : healthStatus === "offline" ? "bg-rose-500/20 text-rose-200" : "bg-slate-600/20 text-slate-200"}`}>
            Backend {healthStatus}
          </span>
        </div>
      }
    >

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Mutation Kill Score" value={`${killScore}%`} subLabel={`${killed} killed / ${survived} survived`} />
          <MetricCard title="Baseline Tests" value={`${baselineTests.length}`} subLabel={`Status: ${baselineStatus}`} />
          <MetricCard title="Generated Mutants" value={`${mutants.length}`} subLabel={`Status: ${generationStatus}`} />
          <MetricCard title="AI Proposals" value={`${proposedTests.length}`} subLabel={`Status: ${aiProposalStatus}`} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="glass-panel neon-edge flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Project Wiring</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="field-label">
                Backend URL
                <input className="field-input" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
              </label>
              <label className="field-label">
                AI Provider
                <input className="field-input" value={aiEngineProvider} onChange={(e) => setAiEngineProvider(e.target.value)} />
              </label>
              <label className="field-label">
                AI Provider URL
                <input className="field-input" value={aiProviderUrl} onChange={(e) => setAiProviderUrl(e.target.value)} />
              </label>
            </div>
            <label className="field-label">
              Workspace Directory
              <input className="field-input" value={workspaceDir} onChange={(e) => setWorkspaceDir(e.target.value)} />
            </label>
            <label className="field-label">
              Target Files (comma-separated)
              <input className="field-input" value={targetFilesInput} onChange={(e) => setTargetFilesInput(e.target.value)} />
            </label>
            <label className="field-label">
              Test File
              <input className="field-input" value={testFile} onChange={(e) => setTestFile(e.target.value)} />
            </label>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-300">Operators</p>
              <div className="flex flex-wrap gap-2">
                {OPERATOR_OPTIONS.map((op) => {
                  const active = operators.includes(op);
                  return (
                    <button
                      key={op}
                      onClick={() => {
                        if (active) {
                          setOperators(operators.filter((item) => item !== op));
                        } else {
                          setOperators([...operators, op]);
                        }
                      }}
                      className={active ? "chip-active" : "chip"}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-panel neon-edge flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Workflow Controls</h2>
            <div className="flex flex-wrap gap-2">
              <button className="btn-main" onClick={runBaselinePhase}>
                Run Baseline
              </button>
              <button className="btn-main" onClick={generateMutationsPhase}>
                Generate Mutants
              </button>
              <button className="btn-main" onClick={executeRunPhase}>
                Execute Run
              </button>
              <button className="btn-main" onClick={proposeTestsPhase}>
                Propose Kill Tests
              </button>
              <button className="btn-outline" onClick={resetAllPhaseData}>
                Clear Session
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Baseline</span>
                <StatusPill value={baselineStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span>Generation</span>
                <StatusPill value={generationStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span>Execution</span>
                <StatusPill value={executionStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span>AI Proposal</span>
                <StatusPill value={aiProposalStatus} />
              </div>
            </div>
            {errorMessage ? <p className="rounded-md bg-rose-500/20 p-2 text-sm text-rose-100">{errorMessage}</p> : null}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="glass-panel neon-edge overflow-hidden">
            <h2 className="mb-4 text-lg font-bold text-white">Mutant Queue</h2>
            <div className="mb-3 flex items-center gap-2 px-1 text-xs">
              <button className="btn-outline" disabled={!mutantsByFile.length} onClick={() => setAllQueueFileCollapse(false)}>
                Expand All
              </button>
              <button className="btn-outline" disabled={!mutantsByFile.length} onClick={() => setAllQueueFileCollapse(true)}>
                Collapse All
              </button>
            </div>
            <div className="max-h-[460px] space-y-2 overflow-auto">
              {mutantsByFile.map((group) => (
                <div key={`dashboard-file-${group.filePath}`} className="rounded-md border border-slate-800/70 bg-slate-950/40 p-2">
                  <button
                    className="mb-2 flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100"
                    onClick={() => toggleQueueFileCollapse(group.filePath)}
                  >
                    <span>📄 {group.filePath} ({group.mutants.length})</span>
                    <span>{collapsedQueueFiles[group.filePath] ? "▸" : "▾"}</span>
                  </button>
                  {!collapsedQueueFiles[group.filePath] ? (
                    <div className="space-y-1">
                      {group.mutants.map((mutant, idx) => (
                        <motion.div
                          key={`dashboard-mutant-${mutant.mutant_id}-${mutant.file_path}-${mutant.line_number}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.01 }}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-slate-800/60 bg-slate-900/60 px-2 py-2 text-sm text-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={mutant.accepted !== false}
                            onChange={(e) => toggleMutantAcceptance(mutant.mutant_id, e.target.checked)}
                          />
                          <span className="font-semibold text-cyan-100">{mutant.mutant_id}</span>
                          <span className="text-xs text-slate-300">L{mutant.line_number}</span>
                          <span
                            className={`text-xs font-semibold ${mutant.accepted !== false ? "text-emerald-300" : "text-rose-300"}`}
                          >
                            {mutant.accepted !== false ? "✅ Accepted" : "❌ Rejected"}
                          </span>
                          <span className="text-xs text-slate-300">{mutant.status ?? "PENDING"}</span>
                          <button className="btn-row ml-auto" onClick={() => previewMutant(mutant.mutant_id)}>
                            Preview
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!mutants.length ? (
                <p className="px-3 py-6 text-center text-slate-400">
                  No mutants loaded yet. Run generation to populate candidates.
                </p>
              ) : null}
            </div>
            <div className="mt-3 rounded-md border border-slate-800/70 bg-slate-950/50 p-3 text-xs text-slate-200">
              <p className="mb-2 font-semibold text-cyan-200">Selection Mode</p>
              <div className="mb-2 flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dashboard-mutant-selection-mode"
                    checked={mutants.length > 0 && acceptedMutantCount === mutants.length}
                    onChange={() => setAllMutantsAcceptance(true)}
                    disabled={!mutants.length}
                  />
                  Select All
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dashboard-mutant-selection-mode"
                    checked={mutants.length > 0 && rejectedMutantCount === mutants.length}
                    onChange={() => setAllMutantsAcceptance(false)}
                    disabled={!mutants.length}
                  />
                  Unselect All
                </label>
              </div>
              <p>Accepted: {acceptedMutantCount}</p>
              <p>Rejected: {rejectedMutantCount}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="glass-panel neon-edge h-[240px]">
              <h2 className="mb-2 text-lg font-bold text-white">Kill Distribution</h2>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={72} innerRadius={38}>
                    <Cell fill="#00e5ff" />
                    <Cell fill="#ff5f96" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel neon-edge h-[240px]">
              <h2 className="mb-2 text-lg font-bold text-white">Execution Trend</h2>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={trendData}>
                  <XAxis dataKey="run" stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#4cc9f0" fill="#4cc9f055" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-panel neon-edge">
            <h2 className="mb-3 text-lg font-bold text-white">Mutant Diff Preview</h2>
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-300">Selected mutant: {selectedMutantId ?? "none"}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <pre className="code-pane">{previewOriginal || "Original code preview appears here."}</pre>
              <pre className="code-pane">{previewMutated || "Mutated code preview appears here."}</pre>
            </div>
          </div>

          <div className="glass-panel neon-edge">
            <h2 className="mb-3 text-lg font-bold text-white">AI Proposed Tests</h2>
            <div className="max-h-[260px] space-y-3 overflow-auto">
              {proposedTests.map((test) => (
                <div key={`${test.targetMutantId}-${test.filePath}`} className="rounded-lg border border-cyan-400/30 bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{test.targetMutantId}</p>
                  <p className="mb-2 text-sm font-semibold text-white">{test.test_fn_name ?? "Generated test block"}</p>
                  <pre className="code-pane-small">{(test.lines ?? []).join("\n")}</pre>
                </div>
              ))}
              {!proposedTests.length ? (
                <p className="text-sm text-slate-300">No test proposals yet. Run execution then trigger AI proposal for survivors.</p>
              ) : null}
            </div>
          </div>
        </section>
    </AppShell>
  );
}
