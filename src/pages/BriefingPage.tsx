import { useEffect } from "react";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function BriefingPage() {
  const { briefing, loadDashboard } = useFlowForgeStore();
  const date = todayKey();

  useEffect(() => {
    void loadDashboard(date);
  }, [date, loadDashboard]);

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Morning briefing</p>
          <h2 className="mt-2 text-3xl font-semibold">{briefing?.headline ?? "Morning briefing unavailable"}</h2>
        </div>
        <button className="button-secondary" onClick={() => void loadDashboard(date)} type="button">
          Run briefing
        </button>
      </div>
      <p className="mt-4 text-sm text-ink/80">{briefing?.focusPrompt ?? "Add an outcome to generate a briefing."}</p>
      <ul className="mt-6 space-y-3">
        {briefing?.outcomes.map((outcome) => (
          <li key={outcome.id} className="rounded-2xl bg-leaf/20 px-4 py-3 text-sm">
            {outcome.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
