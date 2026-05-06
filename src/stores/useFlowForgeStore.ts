import { create } from "zustand";
import { api, type CreateDailyOutcomeRequest, type CreateProjectRequest, type CreateTaskRequest } from "../lib/tauri";
import { useToast } from "../contexts/ToastContext";
import type {
  ActivitySegment,
  AppSettings,
  CalendarAccount,
  CalendarEvent,
  ContextSnapshot,
  ExportBundle,
  FocusBlock,
  FocusSlotSuggestion,
  InterventionSuggestion,
  MorningBriefing,
  MonitoringRule,
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
  calendarAccounts: CalendarAccount[];
  calendarEvents: CalendarEvent[];
  focusBlocks: FocusBlock[];
  monitoringRules: MonitoringRule[];
  activityLog: ActivitySegment[];
  contextSnapshot: ContextSnapshot | null;
  focusSuggestions: FocusSlotSuggestion[];
  loading: boolean;
  activeTask: Task | null;
  latestSuggestion: InterventionSuggestion | null;
  error: string | null;
  loadDashboard: (date: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  loadSettings: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadContextWorkspace: (date: string) => Promise<void>;
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
  connectGoogleCalendar: (input: { authorizationCode: string; redirectUri: string; codeVerifier: string }, date: string) => Promise<void>;
  disconnectCalendar: (accountId: string, date: string) => Promise<void>;
  refreshContextSnapshot: () => Promise<void>;
  suggestFocusSlots: (input: { taskId?: string | null; start: string; end: string; preferredMinutes?: number | null }) => Promise<void>;
  createFocusBlock: (input: { taskId?: string | null; calendarEventId?: string | null; title: string; startsAt: string; endsAt: string; createdBy?: "user" | "suggested" }, date: string) => Promise<void>;
  setFocusBlockStatus: (id: string, status: FocusBlock["status"], date: string) => Promise<void>;
  createMonitoringRule: (input: { ruleType: string; pattern: string; action: "allow" | "redact_title" | "deny"; reason?: string | null }) => Promise<void>;
  deleteMonitoringRule: (id: string) => Promise<void>;
}

type ErrorCategory = "network" | "validation" | "database" | "unknown";

interface CategorizedError {
  message: string;
  category: ErrorCategory;
  retryable: boolean;
}

function categorizeError(error: unknown): CategorizedError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
      return {
        message: "Network connection failed. Please check your internet connection.",
        category: "network",
        retryable: true
      };
    }

    // Validation errors
    if (message.includes("required") || message.includes("invalid") || message.includes("validation")) {
      return {
        message: error.message,
        category: "validation",
        retryable: false
      };
    }

    // Database errors
    if (message.includes("database") || message.includes("sqlite") || message.includes("db")) {
      return {
        message: "Database error. Please try again or restart the app.",
        category: "database",
        retryable: true
      };
    }
  }

  return {
    message: error instanceof Error ? error.message : "An unexpected error occurred.",
    category: "unknown",
    retryable: false
  };
}

async function guard<T>(fn: () => Promise<T>, set: (partial: Partial<FlowForgeState>) => void) {
  try {
    set({ loading: true, error: null });
    return await fn();
  } catch (error) {
    const categorized = categorizeError(error);
    set({ error: categorized.message });
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
  calendarAccounts: [],
  calendarEvents: [],
  focusBlocks: [],
  monitoringRules: [],
  activityLog: [],
  contextSnapshot: null,
  focusSuggestions: [],
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
  loadContextWorkspace: async (date) => {
    await guard(async () => {
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      const [calendarAccounts, calendarEvents, focusBlocks, monitoringRules, activityLog, contextSnapshot] =
        await Promise.all([
          api.listCalendarAccounts(),
          api.listCalendarEvents({ start, end }),
          api.listFocusBlocks({ start, end }),
          api.listMonitoringRules(),
          api.getActivityLog({ start, end }),
          api.getContextSnapshot()
        ]);
      set({ calendarAccounts, calendarEvents, focusBlocks, monitoringRules, activityLog, contextSnapshot });
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
      // Show success toast (will be used by component)
      return true;
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
      set({
        agenda,
        briefing,
        settings,
        projects,
        tasks: [],
        activeTask: null,
        latestSuggestion: null,
        calendarAccounts: [],
        calendarEvents: [],
        focusBlocks: [],
        monitoringRules: [],
        activityLog: [],
        contextSnapshot: null,
        focusSuggestions: []
      });
    }, set);
  },
  updateSettings: async (patch) => {
    await guard(async () => {
      const settings = await api.updateAppSettings(patch);
      set({ settings });
    }, set);
  },
  connectGoogleCalendar: async (input, date) => {
    await guard(async () => {
      await api.connectCalendar({ provider: "google", ...input });
      await useFlowForgeStore.getState().loadContextWorkspace(date);
    }, set);
  },
  disconnectCalendar: async (accountId, date) => {
    await guard(async () => {
      await api.disconnectCalendar(accountId);
      await useFlowForgeStore.getState().loadContextWorkspace(date);
    }, set);
  },
  refreshContextSnapshot: async () => {
    await guard(async () => {
      const contextSnapshot = await api.getContextSnapshot();
      set({ contextSnapshot });
    }, set);
  },
  suggestFocusSlots: async (input) => {
    await guard(async () => {
      const focusSuggestions = await api.suggestFocusSlots(input);
      set({ focusSuggestions });
    }, set);
  },
  createFocusBlock: async (input, date) => {
    await guard(async () => {
      await api.createFocusBlock(input);
      await useFlowForgeStore.getState().loadContextWorkspace(date);
    }, set);
  },
  setFocusBlockStatus: async (id, status, date) => {
    await guard(async () => {
      if (status === "cancelled") {
        await api.cancelFocusBlock(id);
      } else if (status === "active") {
        await api.startFocusBlock(id);
      } else {
        await api.endFocusBlock(id);
      }
      await useFlowForgeStore.getState().loadContextWorkspace(date);
    }, set);
  },
  createMonitoringRule: async (input) => {
    await guard(async () => {
      const rule = await api.createMonitoringRule(input);
      set((state) => ({ monitoringRules: [...state.monitoringRules, rule] }));
    }, set);
  },
  deleteMonitoringRule: async (id) => {
    await guard(async () => {
      await api.deleteMonitoringRule(id);
      set((state) => ({ monitoringRules: state.monitoringRules.filter((rule) => rule.id !== id) }));
    }, set);
  }
}));
