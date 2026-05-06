import { fireEvent, render, screen } from "@testing-library/react";
import { ContextPage } from "./ContextPage";
import type { CalendarEvent, ContextSnapshot, FocusBlock, MonitoringRule, Task } from "../types/domain";

const loadTasks = vi.fn().mockResolvedValue(undefined);
const loadContextWorkspace = vi.fn().mockResolvedValue(undefined);
const createMonitoringRule = vi.fn().mockResolvedValue(undefined);
const deleteMonitoringRule = vi.fn().mockResolvedValue(undefined);
const suggestFocusSlots = vi.fn().mockResolvedValue(undefined);
const createFocusBlock = vi.fn().mockResolvedValue(undefined);
const refreshContextSnapshot = vi.fn().mockResolvedValue(undefined);
const connectGoogleCalendar = vi.fn().mockResolvedValue(undefined);
const disconnectCalendar = vi.fn().mockResolvedValue(undefined);
const setFocusBlockStatus = vi.fn().mockResolvedValue(undefined);

const tasks: Task[] = [
  {
    id: "task-1",
    projectId: null,
    title: "Draft weekly review",
    description: null,
    status: "not_started",
    priority: 2,
    energyLevel: "medium",
    estimatedMinutes: 45,
    actualMinutes: 0,
    dueAt: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    source: "manual",
    startHereHint: null,
    goodEnoughDefinition: null,
    sortOrder: 0,
    createdAt: "2026-05-06T09:00:00Z",
    updatedAt: "2026-05-06T09:00:00Z",
    completedAt: null,
    microTasks: [],
    tags: [],
    links: []
  }
];

const contextSnapshot: ContextSnapshot = {
  generatedAt: "2026-05-06T09:15:00Z",
  state: "unplanned_time",
  activeCalendarEventId: null,
  activeFocusBlockId: null,
  currentTaskId: null,
  activitySummary: "No active meeting or focus block detected.",
  nudge: "Use Agenda to plan a focus block before switching contexts."
};

const calendarEvents: CalendarEvent[] = [
  {
    id: "event-1",
    providerEventId: "google-1",
    accountId: "account-1",
    title: "Design review",
    startsAt: "2026-05-06T11:00:00Z",
    endsAt: "2026-05-06T11:30:00Z",
    busyStatus: "busy",
    location: null,
    meetingUrl: null,
    sourceUpdatedAt: null,
    localUpdatedAt: "2026-05-06T08:00:00Z"
  }
];

const focusBlocks: FocusBlock[] = [
  {
    id: "focus-1",
    taskId: "task-1",
    calendarEventId: null,
    title: "Draft weekly review",
    startsAt: "2026-05-06T13:00:00Z",
    endsAt: "2026-05-06T13:45:00Z",
    status: "planned",
    createdBy: "suggested",
    createdAt: "2026-05-06T08:00:00Z"
  }
];

const monitoringRules: MonitoringRule[] = [
  {
    id: "rule-1",
    ruleType: "domain",
    pattern: "mail.google.com",
    action: "redact_title",
    reason: "Email subjects should be redacted.",
    createdAt: "2026-05-06T08:00:00Z"
  }
];

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => undefined)
}));

vi.mock("@fabianlars/tauri-plugin-oauth", () => ({
  start: vi.fn(),
  onUrl: vi.fn(),
  cancel: vi.fn()
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn()
}));

vi.mock("../stores/useFlowForgeStore", () => ({
  useFlowForgeStore: () => ({
    tasks,
    calendarAccounts: [],
    calendarEvents,
    focusBlocks,
    monitoringRules,
    activityLog: [],
    contextSnapshot,
    focusSuggestions: [],
    loadTasks,
    loadContextWorkspace,
    connectGoogleCalendar,
    disconnectCalendar,
    refreshContextSnapshot,
    suggestFocusSlots,
    createFocusBlock,
    setFocusBlockStatus,
    createMonitoringRule,
    deleteMonitoringRule
  })
}));

describe("ContextPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T09:00:00Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads tasks and context workspace plus renders calendar and focus sections", () => {
    render(<ContextPage />);

    expect(loadTasks).toHaveBeenCalled();
    expect(loadContextWorkspace).toHaveBeenCalledWith("2026-05-06");
    expect(screen.getByText("Design review")).toBeInTheDocument();
    expect(screen.getAllByText("Draft weekly review").length).toBeGreaterThan(0);
  });

  it("adds a monitoring rule from the context page", () => {
    render(<ContextPage />);

    fireEvent.change(screen.getByPlaceholderText(/mail.google.com/i), { target: { value: "calendar.google.com" } });
    fireEvent.click(screen.getByRole("button", { name: /add rule/i }));

    expect(createMonitoringRule).toHaveBeenCalledWith({
      ruleType: "domain",
      pattern: "calendar.google.com",
      action: "redact_title",
      reason: "Added from FlowForge Context page."
    });
  });
});
