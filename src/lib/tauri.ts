import { invoke } from "@tauri-apps/api/core";
import type {
  AppSettings,
  DailyOutcome,
  ExportBundle,
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

export interface CreateMicroTaskRequest {
  title: string;
  estimatedMinutes?: number | null;
}

export interface TaskFilter {
  status?: string | null;
  projectId?: string | null;
  priority?: number | null;
  dueDate?: string | null;
  tag?: string | null;
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
  listTasks: (filter: TaskFilter | null = null) => invoke<Task[]>("list_tasks", { filter }),
  createMicroTask: (taskId: string, input: CreateMicroTaskRequest) =>
    invoke("create_micro_task", { taskId, input }),
  completeMicroTask: (id: string) => invoke("complete_micro_task", { id }),
  startFocusSession: (taskId: string, plannedMinutes: number) =>
    invoke<FocusSession>("start_focus_session", { taskId, plannedMinutes }),
  recordStuckEvent: (taskId: string, reason: string) =>
    invoke<InterventionSuggestion>("record_stuck_event", { taskId, reason }),
  deleteTask: (id: string) => invoke("delete_task", { id }),
  archiveProject: (id: string) => invoke("archive_project", { id }),
  exportUserData: () => invoke<ExportBundle>("export_user_data"),
  purgeUserData: () => invoke("purge_user_data"),
  getAppSettings: () => invoke<AppSettings>("get_app_settings"),
  updateAppSettings: (patch: UpdateSettingsRequest) =>
    invoke<AppSettings>("update_app_settings", { patch })
};
