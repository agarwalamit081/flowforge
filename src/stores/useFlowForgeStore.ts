import { create } from "zustand";
import { api, type CreateDailyOutcomeRequest, type CreateProjectRequest, type CreateTaskRequest } from "../lib/tauri";
import type {
  AppSettings,
  ExportBundle,
  InterventionSuggestion,
  MorningBriefing,
  Project,
  Task,
  TodayAgenda
} from "../types/domain";

interface FlowForgeState {
  agenda: TodayAgenda | null;
  briefing: MorningBriefing | null;
  tasks: Task[];
  projects: Project[];
  settings: AppSettings | null;
  loading: boolean;
  activeTask: Task | null;
  latestSuggestion: InterventionSuggestion | null;
  error: string | null;
  loadDashboard: (date: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  loadSettings: () => Promise<void>;
  loadTasks: () => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
  createTask: (input: CreateTaskRequest, date: string) => Promise<void>;
  createProject: (input: CreateProjectRequest) => Promise<void>;
  createDailyOutcome: (input: CreateDailyOutcomeRequest) => Promise<void>;
  setTaskStatus: (id: string, status: Task["status"], date: string) => Promise<void>;
  markStuck: (taskId: string, reason: string) => Promise<void>;
  updateTask: (id: string, patch: Parameters<typeof api.updateTask>[1], date: string) => Promise<void>;
  deleteTask: (id: string, date: string) => Promise<void>;
  createMicroTask: (taskId: string, input: { title: string; estimatedMinutes?: number | null }) => Promise<void>;
  completeMicroTask: (taskId: string, microTaskId: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  exportUserData: () => Promise<ExportBundle>;
  purgeUserData: (date: string) => Promise<void>;
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

function replaceTaskInAgenda(agenda: TodayAgenda | null, task: Task): TodayAgenda | null {
  if (!agenda) {
    return agenda;
  }
  return {
    ...agenda,
    tasks: agenda.tasks.map((existingTask) => (existingTask.id === task.id ? task : existingTask))
  };
}

export const useFlowForgeStore = create<FlowForgeState>((set) => ({
  agenda: null,
  briefing: null,
  tasks: [],
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
  loadTasks: async () => {
    await guard(async () => {
      const tasks = await api.listTasks();
      set({ tasks });
    }, set);
  },
  selectTask: async (taskId) => {
    if (!taskId) {
      set({ activeTask: null });
      return;
    }
    await guard(async () => {
      const activeTask = await api.getTask(taskId);
      set({ activeTask });
    }, set);
  },
  createTask: async (input, date) => {
    await guard(async () => {
      await api.createTask(input);
      const [agenda, tasks] = await Promise.all([api.listTodayAgenda(date), api.listTasks()]);
      set({ agenda, tasks });
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
      const [task, agenda, tasks] = await Promise.all([
        api.updateTaskStatus(id, status),
        api.listTodayAgenda(date),
        api.listTasks()
      ]);
      set((state) => ({
        agenda,
        tasks,
        activeTask: state.activeTask?.id === id ? task : state.activeTask
      }));
    }, set);
  },
  markStuck: async (taskId, reason) => {
    await guard(async () => {
      const latestSuggestion = await api.recordStuckEvent(taskId, reason);
      set({ latestSuggestion });
    }, set);
  },
  updateTask: async (id, patch, date) => {
    await guard(async () => {
      const [activeTask, agenda, tasks] = await Promise.all([
        api.updateTask(id, patch),
        api.listTodayAgenda(date),
        api.listTasks()
      ]);
      set({ activeTask, agenda: replaceTaskInAgenda(agenda, activeTask), tasks });
    }, set);
  },
  deleteTask: async (id, date) => {
    await guard(async () => {
      await api.deleteTask(id);
      const [agenda, tasks] = await Promise.all([api.listTodayAgenda(date), api.listTasks()]);
      set({ activeTask: null, agenda, tasks });
    }, set);
  },
  createMicroTask: async (taskId, input) => {
    await guard(async () => {
      await api.createMicroTask(taskId, input);
      const [activeTask, tasks] = await Promise.all([api.getTask(taskId), api.listTasks()]);
      set((state) => ({ activeTask, agenda: replaceTaskInAgenda(state.agenda, activeTask), tasks }));
    }, set);
  },
  completeMicroTask: async (taskId, microTaskId) => {
    await guard(async () => {
      await api.completeMicroTask(microTaskId);
      const [activeTask, tasks] = await Promise.all([api.getTask(taskId), api.listTasks()]);
      set((state) => ({ activeTask, agenda: replaceTaskInAgenda(state.agenda, activeTask), tasks }));
    }, set);
  },
  archiveProject: async (id) => {
    await guard(async () => {
      await api.archiveProject(id);
      const [projects, tasks] = await Promise.all([api.listProjects(), api.listTasks()]);
      set({ projects, tasks });
    }, set);
  },
  exportUserData: async () =>
    guard(async () => {
      return api.exportUserData();
    }, set),
  purgeUserData: async (date) => {
    await guard(async () => {
      await api.purgeUserData();
      const [agenda, briefing, settings, projects] = await Promise.all([
        api.listTodayAgenda(date),
        api.runMorningBriefing(date),
        api.getAppSettings(),
        api.listProjects()
      ]);
      set({ agenda, briefing, settings, projects, tasks: [], activeTask: null, latestSuggestion: null });
    }, set);
  },
  updateSettings: async (patch) => {
    await guard(async () => {
      const settings = await api.updateAppSettings(patch);
      set({ settings });
    }, set);
  }
}));
