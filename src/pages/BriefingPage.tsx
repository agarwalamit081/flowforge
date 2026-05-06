import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function BriefingPage() {
  const { briefing, error, loading, loadDashboard } = useFlowForgeStore();
  const date = todayKey();
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    void loadDashboard(date);
  }, [date, loadDashboard]);

  const handleRunBriefing = async () => {
    setIsRunning(true);
    try {
      await loadDashboard(date);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Morning briefing</p>
          <h2 className="mt-2 text-3xl font-semibold">{briefing?.headline ?? "Morning briefing unavailable"}</h2>
        </div>
        <button
          className="button-secondary flex items-center gap-2"
          disabled={isRunning || loading}
          onClick={handleRunBriefing}
          type="button"
        >
          {isRunning || loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Run briefing
        </button>
      </div>
      {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
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
