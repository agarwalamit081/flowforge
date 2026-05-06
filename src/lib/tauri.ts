import { invoke } from "@tauri-apps/api/core";
import type {
  AppSettings,
  DailyOutcome,
  FocusSession,
  InterventionSuggestion,
  MorningBriefing,
  Project,
  Task,
  TaskStatus,
  TodayAgenda
} from "../types/domain";

export interface CreateTaskRequest {
  projectId?: string | null;
  title: string;
  description?: string | null;
  priority?: number;
  dueAt?: string | null;
  estimatedMinutes?: number | null;
  goodEnoughDefinition?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  priority?: number;
  dueAt?: string | null;
  estimatedMinutes?: number | null;
  goodEnoughDefinition?: string | null;
  projectId?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
  color?: string;
}

export interface CreateDailyOutcomeRequest {
  localDate: string;
  title: string;
  successCriteria?: string | null;
}

export interface UpdateSettingsRequest {
  theme?: "system" | "light" | "dark";
  accentColor?: string;
  morningBriefingEnabled?: boolean;
  defaultFocusMinutes?: number;
  defaultAiProvider?: string;
  defaultAiModel?: string;
}

export const api = {
  listTodayAgenda: (date: string) => invoke<TodayAgenda>("list_today_agenda", { date }),
  runMorningBriefing: (date: string) => invoke<MorningBriefing>("run_morning_briefing", { date }),
  createDailyOutcome: (input: CreateDailyOutcomeRequest) =>
    invoke<DailyOutcome>("create_daily_outcome", { input }),
  listProjects: () => invoke<Project[]>("list_projects"),
  createProject: (input: CreateProjectRequest) => invoke<Project>("create_project", { input }),
  createTask: (input: CreateTaskRequest) => invoke<Task>("create_task", { input }),
  updateTaskStatus: (id: string, status: TaskStatus) =>
    invoke<Task>("update_task_status", { id, status }),
  updateTask: (id: string, patch: UpdateTaskRequest) => invoke<Task>("update_task", { id, patch }),
  getTask: (taskId: string) => invoke<Task>("get_task", { taskId }),
  listTasks: () => invoke<Task[]>("list_tasks", { filter: null }),
  startFocusSession: (taskId: string, plannedMinutes: number) =>
    invoke<FocusSession>("start_focus_session", { taskId, plannedMinutes }),
  recordStuckEvent: (taskId: string, reason: string) =>
    invoke<InterventionSuggestion>("record_stuck_event", { taskId, reason }),
  getAppSettings: () => invoke<AppSettings>("get_app_settings"),
  updateAppSettings: (patch: UpdateSettingsRequest) =>
    invoke<AppSettings>("update_app_settings", { patch })
};
