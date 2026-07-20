"use client";

import { AppShell } from "@/components/app-shell";
import { useMutationStore } from "@/store/mutation-store";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ReportsPage() {
  const { runResults, mutants } = useMutationStore();

  const byOperator = useMemo(() => {
    const map = new Map<string, { operator: string; total: number; killed: number }>();
    mutants.forEach((m) => {
      const item = map.get(m.operator_type) ?? { operator: m.operator_type, total: 0, killed: 0 };
      item.total += 1;
      const result = runResults.find((r) => r.mutantId === m.mutant_id);
      if (result?.status === "KILLED") {
        item.killed += 1;
      }
      map.set(m.operator_type, item);
    });
    return [...map.values()];
  }, [mutants, runResults]);

  const killed = runResults.filter((x) => x.status === "KILLED").length;
  const survived = runResults.filter((x) => x.status === "SURVIVED").length;
  const total = runResults.length;
  const score = total ? ((killed / total) * 100).toFixed(1) : "0.0";

  return (
    <AppShell
      title="Reports and Trends"
      subtitle="Live mutation analytics for judge demos and technical review."
      rightContent={<p className="text-sm text-cyan-100">Kill Score: {score}%</p>}
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-panel neon-edge"><p className="text-xs uppercase tracking-[0.2em] text-slate-300">Total Runs</p><p className="mt-2 text-3xl font-black text-white">{total}</p></div>
        <div className="glass-panel neon-edge"><p className="text-xs uppercase tracking-[0.2em] text-slate-300">Killed</p><p className="mt-2 text-3xl font-black text-emerald-300">{killed}</p></div>
        <div className="glass-panel neon-edge"><p className="text-xs uppercase tracking-[0.2em] text-slate-300">Survived</p><p className="mt-2 text-3xl font-black text-rose-300">{survived}</p></div>
      </section>

      <section className="glass-panel neon-edge h-[420px]">
        <h2 className="mb-2 text-lg font-bold text-white">Operator Effectiveness</h2>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={byOperator}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="operator" stroke="#a5b4fc" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" height={70} />
            <YAxis stroke="#a5b4fc" />
            <Tooltip />
            <Bar dataKey="total" fill="#64748b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="killed" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </AppShell>
  );
}
