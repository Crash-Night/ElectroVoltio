// ============================================================================
// ElectroVoltio - Main Application Component
// ============================================================================

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useCircuitStore, scheduleAutoSave } from "@/store";
import Toolbar from "@/components/Toolbar";
import Library from "@/components/Library";
import Canvas from "@/components/Canvas";
import Inspector from "@/components/Inspector";
import EventLog from "@/components/EventLog";
import StatusBar from "@/components/StatusBar";
import ProjectsModal from "@/components/ProjectsModal";
import { useState } from "react";

export default function ElectroVoltioApp() {
  const theme = useCircuitStore((s) => s.theme);
  const [showProjects, setShowProjects] = useState(false);
  const isDirty = useCircuitStore((s) => s.isDirty);
  const autoSaveRef = useRef(false);

  // Auto-save when dirty
  useEffect(() => {
    if (isDirty && autoSaveRef.current) {
      scheduleAutoSave();
    }
    autoSaveRef.current = true;
  }, [isDirty]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const store = useCircuitStore.getState();

    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      store.undo();
    }
    // Ctrl/Cmd + Shift + Z: Redo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
      e.preventDefault();
      store.redo();
    }
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      store.saveProject();
    }
    // Delete: remove a selected waypoint first; otherwise remove components/cables
    if (e.key === "Delete" || e.key === "Backspace") {
      if (store.selectedWaypoint) {
        e.preventDefault();
        store.removeCableWaypoint(store.selectedWaypoint.cableId, store.selectedWaypoint.index);
        return;
      }
      if (store.selectedComponentIds.size > 0) {
        for (const id of store.selectedComponentIds) {
          store.removeComponent(id);
        }
      }
      if (store.selectedCableId) {
        store.removeCable(store.selectedCableId);
      }
    }
    // Escape: Clear selection, cancel tool
    if (e.key === "Escape") {
      store.clearSelection();
      store.setActiveTool("select");
      store.setWireDrawing(null);
    }
    // R: Rotate
    if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
      if (store.selectedComponentIds.size === 1) {
        const id = Array.from(store.selectedComponentIds)[0];
        store.rotateComponent(id);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      data-theme={theme}
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "var(--ev-bg)", color: "var(--ev-text)" }}
    >
      {/* Toolbar */}
      <Toolbar onShowProjects={() => setShowProjects(true)} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Library sidebar */}
        <Library />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas />

          {/* Event log */}
          <EventLog />
        </div>

        {/* Inspector sidebar */}
        <Inspector />
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Projects modal */}
      {showProjects && (
        <ProjectsModal onClose={() => setShowProjects(false)} />
      )}
    </div>
  );
}
