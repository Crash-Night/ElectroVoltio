// ============================================================================
// ElectroVoltio - Projects Modal
// Manages project creation, loading, import/export
// ============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useCircuitStore } from "@/store";
import type { ProjectData } from "@/types/circuit";

interface ProjectsModalProps {
  onClose: () => void;
}

export default function ProjectsModal({ onClose }: ProjectsModalProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "create" | "import">("list");

  const loadProject = useCircuitStore((s) => s.loadProject);
  const saveProject = useCircuitStore((s) => s.saveProject);
  const currentProject = useCircuitStore((s) => s.currentProject);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Error al cargar proyectos");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      setError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) throw new Error("Error al crear proyecto");

      const project = await res.json();

      // Load the new project
      const fullRes = await fetch(`/api/projects/${project.id}`);
      const fullProject = await fullRes.json();
      loadProject(fullProject);
      setNewName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleOpen = async (projectId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Error al cargar proyecto");

      const project = await res.json();
      loadProject(project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("¿Eliminar este proyecto?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleExport = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, { method: "POST" });
      if (!res.ok) throw new Error("Error al exportar");

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.project.name || "project"}.ev.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 422) {
        const error = await res.json();
        setError(`Archivo inválido: ${error.message}`);
        return;
      }

      if (!res.ok) throw new Error("Error al importar");

      const project = await res.json();
      const fullRes = await fetch(`/api/projects/${project.id}`);
      const fullProject = await fullRes.json();
      loadProject(fullProject);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-[560px] max-h-[80vh] rounded-lg shadow-xl overflow-hidden"
        style={{ background: "var(--ev-surface)", color: "var(--ev-text)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--ev-border)" }}
        >
          <h2 className="text-base font-bold">Proyectos</h2>
          <button onClick={onClose} className="text-lg hover:opacity-70">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--ev-border)" }}>
          {(["list", "create", "import"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-xs font-medium"
              style={{
                borderBottom: tab === t ? "2px solid var(--ev-primary)" : "none",
                color: tab === t ? "var(--ev-primary)" : "var(--ev-text-secondary)",
              }}
            >
              {t === "list" ? "Lista" : t === "create" ? "Nuevo" : "Importar"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 text-xs" style={{ background: "#fef2f2", color: "var(--ev-danger)" }}>
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {/* Tab: List */}
          {tab === "list" && (
            <div className="space-y-2">
              {loading ? (
                <div className="text-xs" style={{ color: "var(--ev-text-secondary)" }}>Cargando...</div>
              ) : projects.length === 0 ? (
                <div className="text-xs" style={{ color: "var(--ev-text-secondary)" }}>
                  No hay proyectos. Crea uno nuevo o importa uno existente.
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 px-3 py-2 rounded border"
                    style={{
                      borderColor: currentProject?.id === project.id ? "var(--ev-primary)" : "var(--ev-border)",
                      background: currentProject?.id === project.id ? "var(--ev-bg)" : "transparent",
                    }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{project.name}</div>
                      <div className="text-[10px]" style={{ color: "var(--ev-text-secondary)" }}>
                        v{project.version} • {new Date(project.updatedAt).toLocaleString("es")}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpen(project.id)}
                      className="px-2 py-1 text-xs rounded"
                      style={{ background: "var(--ev-primary)", color: "white" }}
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => handleExport(project.id)}
                      className="px-2 py-1 text-xs rounded border"
                      style={{ borderColor: "var(--ev-border)" }}
                    >
                      Exportar
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 text-xs rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors"
                      title="Eliminar proyecto"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 0 1 1.34-1.34h2.66a1.33 1.33 0 0 1 1.34 1.34V4m2 0v9.33a1.33 1.33 0 0 1-1.34 1.34H4.67a1.33 1.33 0 0 1-1.34-1.34V4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Create */}
          {tab === "create" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Nombre del proyecto</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Mi instalación eléctrica"
                  className="w-full px-3 py-2 text-sm rounded border"
                  style={{
                    background: "var(--ev-bg)",
                    borderColor: "var(--ev-border)",
                    color: "var(--ev-text)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm rounded font-medium disabled:opacity-40"
                style={{ background: "var(--ev-primary)", color: "white" }}
              >
                Crear proyecto
              </button>
            </div>
          )}

          {/* Tab: Import */}
          {tab === "import" && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ev-text-secondary)" }}>
                Importa un archivo .ev.json exportado desde ElectroVoltio.
              </p>
              <label
                className="block w-full px-4 py-8 text-center text-sm rounded border-2 border-dashed cursor-pointer hover:opacity-80"
                style={{ borderColor: "var(--ev-border)", color: "var(--ev-text-secondary)" }}
              >
                Seleccionar archivo
                <input
                  type="file"
                  accept=".json,.ev.json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
