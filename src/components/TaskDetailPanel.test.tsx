import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDetailPanel } from "./TaskDetailPanel";
import type { Task } from "../types/domain";

const task: Task = {
  id: "task-1",
  projectId: null,
  title: "Draft roadmap",
  description: "Outline the next milestone",
  status: "not_started",
  priority: 2,
  energyLevel: "medium",
  estimatedMinutes: 40,
  actualMinutes: 0,
  dueAt: null,
  scheduledStartAt: null,
  scheduledEndAt: null,
  source: "manual",
  startHereHint: null,
  goodEnoughDefinition: "Bullet list of milestones",
  sortOrder: 0,
  createdAt: "2026-05-06T09:00:00Z",
  updatedAt: "2026-05-06T09:00:00Z",
  completedAt: null,
  microTasks: [],
  tags: [],
  links: []
};

describe("TaskDetailPanel", () => {
  it("saves edited task fields", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskDetailPanel
        task={task}
        onClose={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onAddMicroTask={vi.fn().mockResolvedValue(undefined)}
        onCompleteMicroTask={vi.fn().mockResolvedValue(undefined)}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const titleInput = screen.getAllByRole("textbox")[0];
    await user.clear(titleInput);
    await user.type(titleInput, "Finalize roadmap");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Finalize roadmap"
      })
    );
  });

  it("adds a micro-task without blocking the main form", async () => {
    const user = userEvent.setup();
    const onAddMicroTask = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskDetailPanel
        task={task}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onAddMicroTask={onAddMicroTask}
        onCompleteMicroTask={vi.fn().mockResolvedValue(undefined)}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.type(screen.getByPlaceholderText("Small next step"), "Open notes and list milestones");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAddMicroTask).toHaveBeenCalledWith({
      title: "Open notes and list milestones",
      estimatedMinutes: 10
    });
  });
});
