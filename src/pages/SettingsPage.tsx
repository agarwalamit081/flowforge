import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

interface SettingsValues {
  theme: "system" | "light" | "dark";
  accentColor: string;
  morningBriefingEnabled: boolean;
  defaultFocusMinutes: number;
  defaultAiProvider: string;
  defaultAiModel: string;
}

export function SettingsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { settings, loadSettings, updateSettings, exportUserData, purgeUserData } = useFlowForgeStore();
  const { register, handleSubmit, reset } = useForm<SettingsValues>();
  const [exportPreview, setExportPreview] = useState<string>("");

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [reset, settings]);

  return (
    <div className="grid max-w-5xl gap-6 xl:grid-cols-[1fr_360px]">
      <form className="card space-y-4" onSubmit={handleSubmit(async (values) => updateSettings(values))}>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Settings</p>
          <h2 className="mt-2 text-3xl font-semibold">Local defaults</h2>
        </div>
        <select className="input" {...register("theme")}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <input className="input h-12 p-1" type="color" {...register("accentColor")} />
        <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm">
          <input type="checkbox" {...register("morningBriefingEnabled")} />
          Enable morning briefing
        </label>
        <input className="input" min={5} step={5} type="number" {...register("defaultFocusMinutes", { valueAsNumber: true })} />
        <input className="input" placeholder="AI provider" {...register("defaultAiProvider")} />
        <input className="input" placeholder="AI model" {...register("defaultAiModel")} />
        <button className="button-primary" type="submit">
          Save settings
        </button>
      </form>

      <section className="space-y-6">
        <div className="card space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-moss">Data tools</p>
            <h3 className="mt-2 text-2xl font-semibold">Export or reset local data</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="button-secondary"
              onClick={async () => {
                const bundle = await exportUserData();
                const content = JSON.stringify(bundle, null, 2);
                setExportPreview(content);
                const blob = new Blob([content], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `flowforge-export-${today}.json`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}
              type="button"
            >
              Download export
            </button>
            <button
              className="button-primary bg-coral hover:bg-coral/90"
              onClick={async () => {
                if (window.confirm("Purge all local FlowForge data? This cannot be undone.")) {
                  await purgeUserData(today);
                  setExportPreview("");
                }
              }}
              type="button"
            >
              Purge local data
            </button>
          </div>
        </div>

        <div className="card">
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Latest export preview</p>
          <textarea
            className="input mt-4 min-h-72 font-mono text-xs"
            readOnly
            value={exportPreview || "Run an export to inspect the JSON bundle here."}
          />
        </div>
      </section>
    </div>
  );
}
