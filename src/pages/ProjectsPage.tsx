import { useEffect } from "react";
import { ProjectComposer } from "../components/ProjectComposer";
import { useFlowForgeStore } from "../stores/useFlowForgeStore";

export function ProjectsPage() {
  const { projects, loadProjects, createProject, archiveProject } = useFlowForgeStore();

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <div className="space-y-6">
      <ProjectComposer onCreate={createProject} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="card">
            <div className="mb-4 h-2 rounded-full" style={{ backgroundColor: project.color }} />
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="mt-2 text-sm text-ink/70">{project.description || "No description yet."}</p>
            <button className="button-secondary mt-4" onClick={() => archiveProject(project.id)} type="button">
              Archive project
            </button>
          </article>
        ))}
        {!projects.length && <div className="card text-sm text-ink/60">No projects yet.</div>}
      </section>
    </div>
  );
}
