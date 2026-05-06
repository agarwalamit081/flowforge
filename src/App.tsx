import { NavLink, Route, Routes } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Settings, Sunrise } from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { BriefingPage } from "./pages/BriefingPage";
import { SettingsPage } from "./pages/SettingsPage";

const navItems = [
  { to: "/", label: "Today", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/briefing", label: "Briefing", icon: Sunrise },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function App() {
  return (
    <div className="min-h-screen px-4 py-6 text-ink md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
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
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/briefing" element={<BriefingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
