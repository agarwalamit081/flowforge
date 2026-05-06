import { useFlowForgeStore } from "./useFlowForgeStore";
import type { Task, TodayAgenda } from "../types/domain";

const { api } = vi.hoisted(() => ({
  api: {
    listTodayAgenda: vi.fn(),
    runMorningBriefing: vi.fn(),
    createDailyOutcome: vi.fn(),
    listProjects: vi.fn(),
    createProject: vi.fn(),
    createTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    updateTask: vi.fn(),
    getTask: vi.fn(),
    listTasks: vi.fn(),
    createMicroTask: vi.fn(),
    completeMicroTask: vi.fn(),
    startFocusSession: vi.fn(),
    recordStuckEvent: vi.fn(),
    deleteTask: vi.fn(),
    archiveProject: vi.fn(),
    exportUserData: vi.fn(),
    purgeUserData: vi.fn(),
    getAppSettings: vi.fn(),
    updateAppSettings: vi.fn()
  }
}));

vi.mock("../lib/tauri", () => ({
  api
}));

const baseTask: Task = {
  id: "task-1",
  projectId: null,
  title: "Draft agenda",
  description: null,
  status: "not_started",
  priority: 3,
  energyLevel: "medium",
  estimatedMinutes: 25,
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
};

const agendaWithTask: TodayAgenda = {
  date: "2026-05-06",
  outcomes: [],
  tasks: [baseTask]
};

function resetStore() {
  useFlowForgeStore.setState({
    agenda: null,
    briefing: null,
    tasks: [],
    projects: [],
    settings: null,
    loading: false,
    activeTask: null,
    latestSuggestion: null,
    error: null
  });
}

describe("useFlowForgeStore", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it("loads the full task list for agenda workflows", async () => {
    api.listTasks.mockResolvedValue([baseTask]);

    await useFlowForgeStore.getState().loadTasks();

    expect(api.listTasks).toHaveBeenCalledWith();
    expect(useFlowForgeStore.getState().tasks).toEqual([baseTask]);
  });

  it("keeps agenda, task list, and active task in sync after due-date updates", async () => {
    const scheduledTask = { ...baseTask, dueAt: "2026-05-06T17:00:00Z" };
    api.updateTask.mockResolvedValue(scheduledTask);
    api.listTodayAgenda.mockResolvedValue({ ...agendaWithTask, tasks: [scheduledTask] });
    api.listTasks.mockResolvedValue([scheduledTask]);

    useFlowForgeStore.setState({
      agenda: agendaWithTask,
      tasks: [baseTask],
      activeTask: baseTask
    });

    await useFlowForgeStore.getState().updateTask("task-1", { dueAt: "2026-05-06T17:00:00Z" }, "2026-05-06");

    expect(useFlowForgeStore.getState().activeTask?.dueAt).toBe("2026-05-06T17:00:00Z");
    expect(useFlowForgeStore.getState().agenda?.tasks[0].dueAt).toBe("2026-05-06T17:00:00Z");
    expect(useFlowForgeStore.getState().tasks[0].dueAt).toBe("2026-05-06T17:00:00Z");
  });
});
