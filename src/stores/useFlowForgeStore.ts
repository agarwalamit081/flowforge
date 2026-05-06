import { create } from "zustand";
import { api, type CreateDailyOutcomeRequest, type CreateProjectRequest, type CreateTaskRequest } from "../lib/tauri";
import type { AppSettings, InterventionSuggestion, MorningBriefing, Project, Task, TodayAgenda } from "../types/domain";

interface FlowForgeState {
  agenda: TodayAgenda | null;
  briefing: MorningBriefing | null;
  projects: Project[];
  settings: AppSettings | null;
  loading: boolean;
  activeTask: Task | null;
  latestSuggestion: InterventionSuggestion | null;
  error: string | null;
  loadDashboard: (date: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  loadSettings: () => Promise<void>;
  createTask: (input: CreateTaskRequest, date: string) => Promise<void>;
  createProject: (input: CreateProjectRequest) => Promise<void>;
  createDailyOutcome: (input: CreateDailyOutcomeRequest) => Promise<void>;
  setTaskStatus: (id: string, status: Task["status"], date: string) => Promise<void>;
  markStuck: (taskId: string, reason: string) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

async function guard<T>(fn: () => Promise<T>, set: (partial: Partial<FlowForgeState>) => void) {
  try {
    set({ loading: true, error: null });
    return await fn();
  } catch (error) {
    set({ error: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  } finally {
    set({ loading: false });
  }
}

export const useFlowForgeStore = create<FlowForgeState>((set) => ({
  agenda: null,
  briefing: null,
  projects: [],
  settings: null,
  loading: false,
  activeTask: null,
  latestSuggestion: null,
  error: null,
  loadDashboard: async (date) => {
    await guard(async () => {
      const [agenda, briefing] = await Promise.all([api.listTodayAgenda(date), api.runMorningBriefing(date)]);
      set({ agenda, briefing });
    }, set);
  },
  loadProjects: async () => {
    await guard(async () => {
      const projects = await api.listProjects();
      set({ projects });
    }, set);
  },
  loadSettings: async () => {
    await guard(async () => {
      const settings = await api.getAppSettings();
      set({ settings });
    }, set);
  },
  createTask: async (input, date) => {
    await guard(async () => {
      await api.createTask(input);
      const agenda = await api.listTodayAgenda(date);
      set({ agenda });
    }, set);
  },
  createProject: async (input) => {
    await guard(async () => {
      const project = await api.createProject(input);
      set((state) => ({ projects: [...state.projects, project] }));
    }, set);
  },
  createDailyOutcome: async (input) => {
    await guard(async () => {
      await api.createDailyOutcome(input);
      const [agenda, briefing] = await Promise.all([
        api.listTodayAgenda(input.localDate),
        api.runMorningBriefing(input.localDate)
      ]);
      set({ agenda, briefing });
    }, set);
  },
  setTaskStatus: async (id, status, date) => {
    await guard(async () => {
      await api.updateTaskStatus(id, status);
      const agenda = await api.listTodayAgenda(date);
      set({ agenda });
    }, set);
  },
  markStuck: async (taskId, reason) => {
    await guard(async () => {
      const latestSuggestion = await api.recordStuckEvent(taskId, reason);
      set({ latestSuggestion });
    }, set);
  },
  updateSettings: async (patch) => {
    await guard(async () => {
      const settings = await api.updateAppSettings(patch);
      set({ settings });
    }, set);
  }
}));
