import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Command, Calendar, LayoutDashboard, X } from "lucide-react";

interface KeyboardShortcut {
  key: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function useKeyboardShortcuts(
  additionalShortcuts: KeyboardShortcut[] = []
) {
  const navigate = useNavigate();

  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: "ctrl+n",
      description: "New task",
      icon: Plus,
      action: () => {
        // Navigate to dashboard where task composer is available
        navigate("/");
        // Focus the task input after a short delay
        setTimeout(() => {
          const taskInput = document.querySelector("input[placeholder*='Quick capture']") as HTMLInputElement;
          taskInput?.focus();
        }, 100);
      }
    },
    {
      key: "ctrl+k",
      description: "Command palette",
      icon: Command,
      action: () => {
        // TODO: Implement command palette
        console.log("Command palette - coming soon");
      }
    },
    {
      key: "ctrl+d",
      description: "Go to dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/")
    },
    {
      key: "ctrl+a",
      description: "Go to agenda",
      icon: Calendar,
      action: () => navigate("/agenda")
    },
    {
      key: "escape",
      description: "Close panels/modals",
      icon: X,
      action: () => {
        // Close any open panels or modals
        const panels = document.querySelectorAll("[data-panel]");
        panels.forEach((panel) => {
          panel.setAttribute("data-closed", "true");
        });
      }
    }
  ];

  useEffect(() => {
    const allShortcuts = [...defaultShortcuts, ...additionalShortcuts];

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build the key combination string
      let shortcut = "";
      if (ctrl) shortcut += "ctrl+";
      if (shift) shortcut += "shift+";
      if (alt) shortcut += "alt+";
      shortcut += key;

      // Find matching shortcut
      const matchingShortcut = allShortcuts.find((s) => s.key === shortcut);
      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [additionalShortcuts, navigate]);
}

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: "Ctrl+N", description: "New task" },
    { key: "Ctrl+K", description: "Command palette" },
    { key: "Ctrl+D", description: "Go to dashboard" },
    { key: "Ctrl+A", description: "Go to agenda" },
    { key: "Escape", description: "Close panels" }
  ];

  return (
    <div className="card space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-moss">Keyboard shortcuts</h4>
      <div className="grid gap-2 text-sm">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center justify-between">
            <span className="text-ink/70">{shortcut.description}</span>
            <kbd className="rounded bg-ink/10 px-2 py-1 font-mono text-xs">{shortcut.key}</kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
