import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TaskComposer } from "./TaskComposer";
import { ToastProvider } from "../contexts/ToastContext";

describe("TaskComposer", () => {
  it("submits the task title and estimate", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ToastProvider>
        <TaskComposer onCreate={onCreate} />
      </ToastProvider>
    );

    await user.type(screen.getByPlaceholderText("Quick capture to inbox"), "Ship FlowForge shell");
    await user.clear(screen.getByDisplayValue("25"));
    await user.type(screen.getByRole("spinbutton"), "30");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(onCreate).toHaveBeenCalledWith({
      title: "Ship FlowForge shell",
      description: null,
      priority: 3,
      dueAt: null,
      estimatedMinutes: 30
    });
  });
});
