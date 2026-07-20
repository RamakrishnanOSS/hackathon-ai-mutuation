import { create } from "zustand";
import {
  acceptMutation,
  executeMutationRun,
  generateMutations,
  generateTestsForSurvivors,
  getBaselineRunStatus,
  getRunStatus,
  health,
  previewMutation,
  rejectMutation,
  resetProject,
  startBaselineRun,
} from "@/lib/api-client";
import {
  BaselineRunProgress,
  BaselineTest,
  Mutant,
  MutationRunLogEntry,
  MutationRunProgress,
  MutationRunResult,
  PhaseStatus,
  ProposedTest,
} from "@/lib/types";

export interface ImportedProjectFile {
  path: string;
  content: string;
  isTest: boolean;
}

interface MutationStore {
  backendUrl: string;
  projectId: string;
  workspaceDir: string;
  targetFilesInput: string;
  operators: string[];
  aiEngineProvider: string;
  aiProviderUrl: string;
  testFile: string;
  mutationGeneratorFramework: string;
  testExecutorFramework: string;
  mutationAdapterId: string;
  testExecutorAdapterId: string;
  importedProjectFiles: ImportedProjectFile[];
  selectedTestFiles: string[];

  healthStatus: "unknown" | "online" | "offline";
  baselineStatus: PhaseStatus;
  generationStatus: PhaseStatus;
  executionStatus: PhaseStatus;
  aiProposalStatus: PhaseStatus;

  baselineTests: BaselineTest[];
  baselineProgress: BaselineRunProgress;
  mutants: Mutant[];
  runResults: MutationRunResult[];
  runLogs: MutationRunLogEntry[];
  runProgress: MutationRunProgress;
  proposedTests: ProposedTest[];
  selectedMutantId: string | null;
  previewOriginal: string;
  previewMutated: string;
  currentRunId: string | null;
  errorMessage: string | null;

  setBackendUrl: (value: string) => void;
  setWorkspaceDir: (value: string) => void;
  setTargetFilesInput: (value: string) => void;
  setAiEngineProvider: (value: string) => void;
  setAiProviderUrl: (value: string) => void;
  setTestFile: (value: string) => void;
  setOperators: (ops: string[]) => void;
  setMutationGeneratorFramework: (value: string) => void;
  setTestExecutorFramework: (value: string) => void;
  setMutationAdapterId: (value: string) => void;
  setTestExecutorAdapterId: (value: string) => void;
  setImportedProjectFiles: (files: ImportedProjectFile[]) => void;
  setSelectedTestFiles: (value: string[] | ((prev: string[]) => string[])) => void;

  checkHealth: () => Promise<void>;
  runBaselinePhase: () => Promise<void>;
  generateMutationsPhase: () => Promise<void>;
  toggleMutantAcceptance: (mutantId: string, accepted: boolean) => Promise<void>;
  setAllMutantsAcceptance: (accepted: boolean) => void;
  previewMutant: (mutantId: string) => Promise<void>;
  executeRunPhase: () => Promise<void>;
  proposeTestsPhase: () => Promise<void>;
  resetAllPhaseData: () => Promise<void>;
}

const defaultOperators = [
  "relational_operator_replacement",
  "arithmetic_substitution",
  "boundary_value_tweak",
  "boolean_inversion",
  "return_value_stripping",
];

const MAX_MUTANTS_PER_EXECUTION = 40;

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export const useMutationStore = create<MutationStore>((set, get) => ({
  backendUrl: "http://127.0.0.1:8000",
  projectId: "default",
  workspaceDir: "c:/kiran/hackathon/hackathon-ai-mutuation",
  targetFilesInput: "agent/hello.py,agent/hello.cpp",
  operators: defaultOperators,
  aiEngineProvider: "ollama",
  aiProviderUrl: "http://localhost:11434",
  testFile: "agent/test_hello.py",
  mutationGeneratorFramework: "builtin-ast",
  testExecutorFramework: "pytest/gtest",
  mutationAdapterId: "core.ast.adapter.v1",
  testExecutorAdapterId: "core.runner.adapter.v1",
  importedProjectFiles: [],
  selectedTestFiles: [],

  healthStatus: "unknown",
  baselineStatus: "idle",
  generationStatus: "idle",
  executionStatus: "idle",
  aiProposalStatus: "idle",

  baselineTests: [],
  baselineProgress: {
    phase: "queued",
    totalSuites: 0,
    completedSuites: 0,
    currentFramework: null,
    currentTarget: null,
    message: "Idle",
  },
  mutants: [],
  runResults: [],
  runLogs: [],
  runProgress: {
    totalMutants: 0,
    completedMutants: 0,
    currentMutantId: null,
    currentMutantFile: null,
    currentFramework: null,
    currentTestName: null,
    phase: "queued",
  },
  proposedTests: [],
  selectedMutantId: null,
  previewOriginal: "",
  previewMutated: "",
  currentRunId: null,
  errorMessage: null,

  setBackendUrl: (value) => set({ backendUrl: value }),
  setWorkspaceDir: (value) => set({ workspaceDir: value }),
  setTargetFilesInput: (value) => set({ targetFilesInput: value }),
  setAiEngineProvider: (value) => set({ aiEngineProvider: value }),
  setAiProviderUrl: (value) => set({ aiProviderUrl: value }),
  setTestFile: (value) => set({ testFile: value }),
  setOperators: (ops) => set({ operators: ops }),
  setMutationGeneratorFramework: (value) => set({ mutationGeneratorFramework: value }),
  setTestExecutorFramework: (value) => set({ testExecutorFramework: value }),
  setMutationAdapterId: (value) => set({ mutationAdapterId: value }),
  setTestExecutorAdapterId: (value) => set({ testExecutorAdapterId: value }),
  setImportedProjectFiles: (files) => set({ importedProjectFiles: files }),
  setSelectedTestFiles: (value) =>
    set((state) => ({
      selectedTestFiles: typeof value === "function" ? value(state.selectedTestFiles) : value,
    })),

  checkHealth: async () => {
    const { backendUrl } = get();
    try {
      await health(backendUrl);
      set({ healthStatus: "online", errorMessage: null });
    } catch {
      set({ healthStatus: "offline" });
    }
  },

  runBaselinePhase: async () => {
    const { backendUrl, projectId, workspaceDir } = get();
    set({
      baselineStatus: "running",
      baselineProgress: {
        phase: "queued",
        totalSuites: 0,
        completedSuites: 0,
        currentFramework: null,
        currentTarget: null,
        message: "Queued",
      },
      errorMessage: null,
    });
    try {
      const started = await startBaselineRun(backendUrl, projectId, workspaceDir, "all");

      let done = false;
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const status = await getBaselineRunStatus(backendUrl, projectId, started.runId);

        if (status.progress) {
          set({ baselineProgress: status.progress });
        }

        if (status.status === "COMPLETED") {
          const result = status.result;
          set({
            baselineStatus: result?.status === "SUCCESS" ? "success" : "error",
            baselineTests: result?.details?.tests ?? [],
            baselineProgress:
              status.progress ?? {
                phase: "completed",
                totalSuites: 0,
                completedSuites: 0,
                currentFramework: null,
                currentTarget: null,
                message: "Completed",
              },
          });
          done = true;
        }

        if (status.status === "ERROR") {
          set({
            baselineStatus: "error",
            errorMessage: status.errorMessage || "Baseline run failed",
            baselineProgress:
              status.progress ?? {
                phase: "error",
                totalSuites: 0,
                completedSuites: 0,
                currentFramework: null,
                currentTarget: null,
                message: "Failed",
              },
          });
          done = true;
        }
      }
    } catch (err) {
      set({
        baselineStatus: "error",
        baselineProgress: {
          phase: "error",
          totalSuites: 0,
          completedSuites: 0,
          currentFramework: null,
          currentTarget: null,
          message: "Failed",
        },
        errorMessage: err instanceof Error ? err.message : "Failed to run baseline",
      });
    }
  },

  generateMutationsPhase: async () => {
    const { backendUrl, projectId, workspaceDir, targetFilesInput, operators, aiEngineProvider, aiProviderUrl } = get();
    const targetFiles = splitCsv(targetFilesInput);
    if (!targetFiles.length) {
      set({ generationStatus: "error", errorMessage: "Enter at least one target file." });
      return;
    }

    set({
      generationStatus: "running",
      mutants: [],
      selectedMutantId: null,
      previewOriginal: "",
      previewMutated: "",
      runResults: [],
      errorMessage: null,
    });
    try {
      const res = await generateMutations(
        backendUrl,
        projectId,
        workspaceDir,
        targetFiles,
        operators,
        aiEngineProvider,
        aiProviderUrl,
      );
      set({
        generationStatus: "success",
        mutants: (res.mutants ?? []).map((m) => ({ ...m, accepted: true, status: "PENDING" })),
      });
    } catch (err) {
      set({
        generationStatus: "error",
        errorMessage: err instanceof Error ? err.message : "Failed to generate mutations",
      });
    }
  },

  toggleMutantAcceptance: async (mutantId, accepted) => {
    const { backendUrl, projectId, mutants } = get();
    set({
      mutants: mutants.map((m) => (m.mutant_id === mutantId ? { ...m, accepted } : m)),
    });

    try {
      if (accepted) {
        await acceptMutation(backendUrl, projectId, mutantId);
      } else {
        await rejectMutation(backendUrl, projectId, mutantId);
      }
    } catch (err) {
      set({
        errorMessage: err instanceof Error ? err.message : "Failed to update mutant acceptance",
      });
    }
  },

  setAllMutantsAcceptance: (accepted) => {
    set((state) => ({
      mutants: state.mutants.map((m) => ({ ...m, accepted })),
    }));
  },

  previewMutant: async (mutantId) => {
    const { backendUrl, projectId, workspaceDir } = get();
    try {
      const res = await previewMutation(backendUrl, projectId, mutantId, workspaceDir);
      set({
        selectedMutantId: mutantId,
        previewOriginal: res.original,
        previewMutated: res.mutated,
        errorMessage: null,
      });
    } catch (err) {
      set({
        errorMessage: err instanceof Error ? err.message : "Failed to preview mutant",
      });
    }
  },

  executeRunPhase: async () => {
    const { backendUrl, projectId, workspaceDir, mutants } = get();
    const acceptedMutants = mutants.filter((m) => m.accepted !== false).map((m) => m.mutant_id);
    const overLimit = acceptedMutants.length > MAX_MUTANTS_PER_EXECUTION;
    const executionMutants = overLimit
      ? acceptedMutants.slice(0, MAX_MUTANTS_PER_EXECUTION)
      : acceptedMutants;

    if (!executionMutants.length) {
      set({ executionStatus: "error", errorMessage: "No accepted mutants selected." });
      return;
    }

    set({
      executionStatus: "running",
      runResults: [],
      runLogs: overLimit
        ? [
            {
              timestamp: new Date().toISOString(),
              level: "WARN",
              source: "ui",
              message: `Large selection detected (${acceptedMutants.length}). Executing top ${MAX_MUTANTS_PER_EXECUTION} mutants in this run.`,
            },
          ]
        : [],
      runProgress: {
        totalMutants: executionMutants.length,
        completedMutants: 0,
        currentMutantId: null,
        currentMutantFile: null,
        currentFramework: null,
        currentTestName: null,
        phase: "queued",
      },
      errorMessage: overLimit
        ? `Execution capped to ${MAX_MUTANTS_PER_EXECUTION} mutants for responsiveness. Reject some mutants and rerun for the rest.`
        : null,
    });

    try {
      const run = await executeMutationRun(backendUrl, projectId, workspaceDir, executionMutants);
      set({ currentRunId: run.runId });

      let isDone = false;
      let pollCount = 0;
      const maxPolls = 600;
      while (!isDone) {
        if (pollCount >= maxPolls) {
          throw new Error("Mutation run polling timed out after 11 minutes.");
        }
        pollCount += 1;

        // Keep polling to match existing backend contract.
        await new Promise((resolve) => setTimeout(resolve, 1100));
        const status = await getRunStatus(backendUrl, projectId, run.runId);

        const incomingLogs = status.logs ?? [];

        set((state) => ({
          runLogs: incomingLogs.length ? incomingLogs : state.runLogs,
          runProgress:
            status.progress ??
            ({
              totalMutants: state.runProgress.totalMutants,
              completedMutants: status.results?.length ?? state.runProgress.completedMutants,
              currentMutantId: null,
              currentMutantFile: null,
              currentFramework: state.runProgress.currentFramework,
              currentTestName: null,
              phase:
                status.status === "COMPLETED"
                  ? "completed"
                  : status.status === "ERROR"
                    ? "error"
                    : "running",
            } as MutationRunProgress),
        }));

        if (status.status === "COMPLETED") {
          const updatedResults = status.results ?? [];
          set((state) => ({
            executionStatus: "success",
            runResults: updatedResults,
            runLogs: status.logs ?? state.runLogs,
            runProgress:
              status.progress ?? {
                totalMutants: state.runProgress.totalMutants,
                completedMutants: updatedResults.length,
                currentMutantId: null,
                currentMutantFile: null,
                currentFramework: state.runProgress.currentFramework,
                currentTestName: null,
                phase: "completed",
              },
            mutants: state.mutants.map((m) => {
              const result = updatedResults.find((r) => r.mutantId === m.mutant_id);
              if (!result) {
                return m;
              }
              return {
                ...m,
                status: result.status,
              };
            }),
          }));
          isDone = true;
        }

        if (status.status === "ERROR") {
          const statusMessage =
            ((status as unknown as { errorMessage?: string }).errorMessage || "Mutation run failed")
              .toString();
          set((state) => ({
            executionStatus: "error",
            runLogs: [
              ...state.runLogs,
              {
                timestamp: new Date().toISOString(),
                level: "ERROR",
                source: "engine",
                message: statusMessage,
              },
            ],
            runProgress: {
              ...state.runProgress,
              phase: "error",
            },
            errorMessage: statusMessage,
          }));
          isDone = true;
        }
      }
    } catch (err) {
      set({
        executionStatus: "error",
        runLogs: [
          ...get().runLogs,
          {
            timestamp: new Date().toISOString(),
            level: "ERROR",
            source: "engine",
            message: err instanceof Error ? err.message : "Failed to execute mutation run",
          },
        ],
        runProgress: {
          ...get().runProgress,
          phase: "error",
        },
        errorMessage: err instanceof Error ? err.message : "Failed to execute mutation run",
      });
    }
  },

  proposeTestsPhase: async () => {
    const {
      backendUrl,
      projectId,
      workspaceDir,
      targetFilesInput,
      testFile,
      aiEngineProvider,
      aiProviderUrl,
      runResults,
    } = get();

    const survivors = runResults.filter((r) => r.status === "SURVIVED").map((r) => r.mutantId);
    if (!survivors.length) {
      set({ aiProposalStatus: "success", proposedTests: [] });
      return;
    }

    set({ aiProposalStatus: "running", errorMessage: null });
    try {
      const response = await generateTestsForSurvivors(
        backendUrl,
        projectId,
        workspaceDir,
        survivors,
        splitCsv(targetFilesInput),
        testFile,
        aiEngineProvider,
        aiProviderUrl,
      );

      set({
        aiProposalStatus: "success",
        proposedTests: response.proposedTests ?? [],
      });
    } catch (err) {
      set({
        aiProposalStatus: "error",
        errorMessage: err instanceof Error ? err.message : "Failed to propose tests",
      });
    }
  },

  resetAllPhaseData: async () => {
    const { backendUrl, projectId } = get();
    try {
      await resetProject(backendUrl, projectId);
    } catch {
      // Keep local reset behavior even if backend reset fails.
    }

    set({
      baselineStatus: "idle",
      generationStatus: "idle",
      executionStatus: "idle",
      aiProposalStatus: "idle",
      baselineTests: [],
      baselineProgress: {
        phase: "queued",
        totalSuites: 0,
        completedSuites: 0,
        currentFramework: null,
        currentTarget: null,
        message: "Idle",
      },
      mutants: [],
      runResults: [],
      runLogs: [],
      runProgress: {
        totalMutants: 0,
        completedMutants: 0,
        currentMutantId: null,
        currentMutantFile: null,
        currentFramework: null,
        currentTestName: null,
        phase: "queued",
      },
      proposedTests: [],
      selectedMutantId: null,
      previewOriginal: "",
      previewMutated: "",
      currentRunId: null,
      errorMessage: null,
    });
  },
}));
