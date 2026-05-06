import { fireEvent, render, screen } from "@testing-library/react";
import { AgendaPage } from "./AgendaPage";
import type { Task } from "../types/domain";

const loadTasks = vi.fn().mockResolvedValue(undefined);
const selectTask = vi.fn().mockResolvedValue(undefined);
const updateTask = vi.fn().mockResolvedValue(undefined);
const deleteTask = vi.fn().mockResolvedValue(undefined);

const tasks: Task[] = [
  {
    id: "inbox-1",
    projectId: null,
    title: "Capture launch notes",
    description: null,
    status: "not_started",
    priority: 3,
    energyLevel: "medium",
    estimatedMinutes: 20,
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
  },
  {
    id: "planned-1",
    projectId: null,
    title: "Ship release draft",
    description: null,
    status: "in_progress",
    priority: 1,
    energyLevel: "high",
    estimatedMinutes: 90,
    actualMinutes: 15,
    dueAt: "2026-05-06T17:00:00",
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

vi.mock("../stores/useFlowForgeStore", () => ({
  useFlowForgeStore: () => ({
    tasks,
    loadTasks,
    selectTask,
    updateTask,
    deleteTask
  })
}));

describe("AgendaPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T09:00:00Z"));
    loadTasks.mockClear();
    selectTask.mockClear();
    updateTask.mockClear();
    deleteTask.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads tasks and shows inbox plus planned sections", () => {
    render(<AgendaPage />);

    expect(loadTasks).toHaveBeenCalled();
    expect(screen.getByText("Capture launch notes")).toBeInTheDocument();
    expect(screen.getByText("Ship release draft")).toBeInTheDocument();
  });

  it("plans an inbox task for today", async () => {
    render(<AgendaPage />);

    fireEvent.click(screen.getByRole("button", { name: /plan today/i }));

    expect(updateTask).toHaveBeenCalledWith(
      "inbox-1",
      { dueAt: "2026-05-06T17:00:00" },
      "2026-05-06"
    );
  });

  it("moves a planned task back to inbox", () => {
    render(<AgendaPage />);

    fireEvent.click(screen.getByRole("button", { name: /back to inbox/i }));

    expect(updateTask).toHaveBeenCalledWith("planned-1", { dueAt: "" }, "2026-05-06");
  });
});
