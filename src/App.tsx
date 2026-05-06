import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Inbox, LayoutDashboard, FolderKanban, Settings, Sunrise, Radar } from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { AgendaPage } from "./pages/AgendaPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { BriefingPage } from "./pages/BriefingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ContextPage } from "./pages/ContextPage";
import { useFlowForgeStore } from "./stores/useFlowForgeStore";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/Toast";
import { OnboardingWizard, useOnboarding } from "./components/OnboardingWizard";
import { CommandPalette } from "./components/CommandPalette";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const navItems = [
  { to: "/", label: "Today", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: Inbox },
  { to: "/context", label: "Context", icon: Radar },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/briefing", label: "Briefing", icon: Sunrise },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function App() {
  const { settings, loadSettings } = useFlowForgeStore();
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  useKeyboardShortcuts();

  // Early theme injection to prevent flash and layout shift
  useEffect(() => {
    const savedTheme = localStorage.getItem("flowforge-theme");
    const root = document.documentElement;
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      root.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  useEffect(() => {
    if (!settings) {
      void loadSettings();
    }
  }, [loadSettings, settings]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const mode = settings?.theme ?? "system";
      const resolved = mode === "system" ? (mediaQuery.matches ? "dark" : "light") : mode;

      // Store resolved theme in localStorage for persistence across sessions
      localStorage.setItem("flowforge-theme", resolved);

      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(resolved === "dark" ? "theme-dark" : "theme-light");
    };

    // Apply theme on mount to prevent flicker
    const savedTheme = localStorage.getItem("flowforge-theme");
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(savedTheme === "dark" ? "theme-dark" : "theme-light");
    }

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [settings?.theme]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();
    let unlistenResize: (() => void) | undefined;

    // Window close-to-tray is handled in Rust (src-tauri/src/lib.rs)
    // This prevents duplicate event handling
    void currentWindow.onResized(async () => {
      if (await currentWindow.isMinimized()) {
        await currentWindow.hide();
      }
    }).then((fn) => {
      unlistenResize = fn;
    });

    return () => {
      unlistenResize?.();
    };
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen px-4 py-6 text-ink md:px-8">
        <div className="mx-auto grid w-full max-w-[1400px] gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="card h-fit">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-moss">FlowForge</p>
              <h1 className="mt-3 text-3xl font-semibold">Momentum, not pressure.</h1>
            </div>
            <nav className="space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? "bg-ink text-white" : "text-ink hover:bg-leaf/30"
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="space-y-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/context" element={<ContextPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/briefing" element={<BriefingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
        <ToastContainer />
        {showOnboarding && <OnboardingWizard onClose={() => setShowOnboarding(false)} />}
      </div>
      <CommandPalette />
    </ToastProvider>
  );
}
