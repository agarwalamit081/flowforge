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
