import { useEffect } from "react";
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
  const { settings, loadSettings, updateSettings } = useFlowForgeStore();
  const { register, handleSubmit, reset } = useForm<SettingsValues>();

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [reset, settings]);

  return (
    <form className="card max-w-3xl space-y-4" onSubmit={handleSubmit(async (values) => updateSettings(values))}>
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
  );
}
