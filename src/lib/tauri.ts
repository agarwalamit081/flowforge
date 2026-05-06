import { invoke } from "@tauri-apps/api/core";
import type {
  AppSettings,
  ActivitySegment,
  CalendarAccount,
  CalendarEvent,
  ContextSnapshot,
  DailyOutcome,
  ExportBundle,
  FocusBlock,
  FocusSlotSuggestion,
  FocusSession,
  InterventionSuggestion,
  MorningBriefing,
  MonitoringRule,
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

export interface CalendarConnectRequest {
  provider: "google";
  authorizationCode: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface CalendarRangeRequest {
  start: string;
  end: string;
}

export interface FocusSlotSuggestionRequest {
  taskId?: string | null;
  start: string;
  end: string;
  preferredMinutes?: number | null;
}

export interface CreateFocusBlockRequest {
  taskId?: string | null;
  calendarEventId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  createdBy?: "user" | "suggested";
}

export interface CreateMonitoringRuleRequest {
  ruleType: string;
  pattern: string;
  action: "allow" | "redact_title" | "deny";
  reason?: string | null;
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
    invoke<AppSettings>("update_app_settings", { patch }),
  connectCalendar: (input: CalendarConnectRequest) =>
    invoke<CalendarAccount>("connect_calendar", { input }),
  disconnectCalendar: (accountId: string) => invoke("disconnect_calendar", { accountId }),
  listCalendarAccounts: () => invoke<CalendarAccount[]>("list_calendar_accounts"),
  listCalendarEvents: (range: CalendarRangeRequest) =>
    invoke<CalendarEvent[]>("list_calendar_events", { range }),
  suggestFocusSlots: (input: FocusSlotSuggestionRequest) =>
    invoke<FocusSlotSuggestion[]>("suggest_focus_slots", { input }),
  createFocusBlock: (input: CreateFocusBlockRequest) =>
    invoke<FocusBlock>("create_focus_block", { input }),
  cancelFocusBlock: (id: string) => invoke<FocusBlock>("cancel_focus_block", { id }),
  startFocusBlock: (id: string) => invoke<FocusBlock>("start_focus_block", { id }),
  endFocusBlock: (id: string) => invoke<FocusBlock>("end_focus_block", { id }),
  listFocusBlocks: (range: CalendarRangeRequest) =>
    invoke<FocusBlock[]>("list_focus_blocks", { range }),
  listMonitoringRules: () => invoke<MonitoringRule[]>("list_monitoring_rules"),
  createMonitoringRule: (input: CreateMonitoringRuleRequest) =>
    invoke<MonitoringRule>("create_monitoring_rule", { input }),
  deleteMonitoringRule: (id: string) => invoke("delete_monitoring_rule", { id }),
  getActivityLog: (range: CalendarRangeRequest) =>
    invoke<ActivitySegment[]>("get_activity_log", { range }),
  getContextSnapshot: () => invoke<ContextSnapshot>("get_context_snapshot")
};
