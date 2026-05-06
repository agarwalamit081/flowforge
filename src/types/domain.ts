export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "stuck"
  | "blocked"
  | "done"
  | "archived";

export type Priority = 1 | 2 | 3 | 4 | 5;

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface MicroTask {
  id: string;
  taskId: string;
  title: string;
  position: number;
  estimatedMinutes: number;
  status: "not_started" | "in_progress" | "done";
  createdAt: string;
  completedAt: string | null;
}

export interface TaskLink {
  id: string;
  taskId: string;
  linkType: string;
  label: string;
  target: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  energyLevel: "low" | "medium" | "high";
  estimatedMinutes: number | null;
  actualMinutes: number;
  dueAt: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  source: "manual" | "calendar" | "email" | "voice" | "ai_decomposed";
  startHereHint: string | null;
  goodEnoughDefinition: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  microTasks: MicroTask[];
  tags: string[];
  links: TaskLink[];
}

export interface DailyOutcome {
  id: string;
  localDate: string;
  title: string;
  successCriteria: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface TodayAgenda {
  date: string;
  outcomes: DailyOutcome[];
  tasks: Task[];
}

export interface MorningBriefing {
  date: string;
  headline: string;
  focusPrompt: string;
  outcomes: DailyOutcome[];
  suggestedTaskIds: string[];
}

export interface FocusSession {
  id: string;
  taskId: string;
  plannedMinutes: number;
  startedAt: string;
  endedAt: string | null;
  outcome: string | null;
  actualMinutes: number | null;
}

export interface CalendarAccount {
  id: string;
  provider: string;
  email: string;
  displayName: string | null;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  providerEventId: string;
  accountId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  busyStatus: "busy" | "tentative" | "free" | "out_of_office";
  location: string | null;
  meetingUrl: string | null;
  sourceUpdatedAt: string | null;
  localUpdatedAt: string;
}

export interface FocusBlock {
  id: string;
  taskId: string | null;
  calendarEventId: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  status: "planned" | "active" | "completed" | "cancelled";
  createdBy: "user" | "suggested";
  createdAt: string;
}

export interface MonitoringRule {
  id: string;
  ruleType: string;
  pattern: string;
  action: "allow" | "redact_title" | "deny";
  reason: string | null;
  createdAt: string;
}

export interface ActivitySegment {
  id: string;
  appName: string | null;
  processName: string | null;
  windowTitleRedacted: string | null;
  domain: string | null;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  privacyState: "allowed" | "redacted_title" | "denied";
  linkedFocusSessionId: string | null;
}

export interface ContextSnapshot {
  generatedAt: string;
  state: "focus_block_active" | "in_meeting" | "unplanned_time";
  activeCalendarEventId: string | null;
  activeFocusBlockId: string | null;
  currentTaskId: string | null;
  activitySummary: string | null;
  nudge: string | null;
}

export interface FocusSlotSuggestion {
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  reason: string;
  taskId: string | null;
}

export interface InterventionSuggestion {
  taskId: string;
  reason: string;
  prompt: string;
  nextStep: string;
}

export interface AppSettings {
  theme: "system" | "light" | "dark";
  accentColor: string;
  morningBriefingEnabled: boolean;
  defaultFocusMinutes: number;
  defaultAiProvider: string;
  defaultAiModel: string;
}

export interface ExportBundle {
  projects: Project[];
  tasks: Task[];
  dailyOutcomes: DailyOutcome[];
  focusSessions: FocusSession[];
  settings: AppSettings;
}
