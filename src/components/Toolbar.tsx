// ============================================================================
// ElectroVoltio - Toolbar Component (SVG icons)
// ============================================================================

"use client";

import React, { useState } from "react";
import { useCircuitStore } from "@/store";
import { ALL_PRESETS } from "@/data/presets";
import type { ToolType } from "@/types/circuit";

interface ToolbarProps {
  onShowProjects: () => void;
}

// --- SVG toolbar icons ------------------------------------------------------

function IconCursor({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2l8 5.5H7L5 13l-1-4.5L3 2z" strokeLinejoin="round" />
    </svg>
  );
}

function IconWire({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" strokeLinecap="round" />
      <circle cx="2" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 0 1 1.34-1.34h2.66a1.33 1.33 0 0 1 1.34 1.34V4m2 0v9.33a1.33 1.33 0 0 1-1.34 1.34H4.67a1.33 1.33 0 0 1-1.34-1.34V4" strokeLinecap="round" />
    </svg>
  );
}

function IconRotate({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.5 8a6.5 6.5 0 0 1 11.33-4M14.5 8a6.5 6.5 0 0 1-11.33 4" strokeLinecap="round" />
      <path d="M12.5 1v3h-3M3.5 15v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPan({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1v14M1 8h14M8 1l-2 2M8 1l2 2M8 15l-2-2M8 15l2-2M1 8l2-2M1 8l2 2M15 8l-2-2M15 8l-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h4l2 2h6v8H2V3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 14H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h6l3 3v8a1 1 0 0 1-1 1z" />
      <path d="M10 2v3H6V2M6 10h4" strokeLinecap="round" />
    </svg>
  );
}

function IconUndo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h7a3 3 0 1 1 0 6H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 3L3 6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRedo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 6H6a3 3 0 1 0 0 6h2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconZoomIn({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5M5 7h4M7 5v4" strokeLinecap="round" />
    </svg>
  );
}

function IconZoomOut({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5M5 7h4" strokeLinecap="round" />
    </svg>
  );
}

function IconPlay({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5L4 2.5z" />
    </svg>
  );
}

function IconSun({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

function IconMoon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.5 10.5A6 6 0 0 1 5.5 2.5 6 6 0 1 0 13.5 10.5z" />
    </svg>
  );
}

const tools: { id: ToolType; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "select", label: "Seleccionar", Icon: IconCursor },
  { id: "wire", label: "Cablear", Icon: IconWire },
  { id: "delete", label: "Eliminar", Icon: IconTrash },
  { id: "rotate", label: "Rotar", Icon: IconRotate },
  { id: "pan", label: "Mover vista", Icon: IconPan },
];

export default function Toolbar({ onShowProjects }: ToolbarProps) {
  const activeTool = useCircuitStore((s) => s.activeTool);
  const setActiveTool = useCircuitStore((s) => s.setActiveTool);
  const undo = useCircuitStore((s) => s.undo);
  const redo = useCircuitStore((s) => s.redo);
  const historyIndex = useCircuitStore((s) => s.historyIndex);
  const historyLength = useCircuitStore((s) => s.history.length);
  const runSimulation = useCircuitStore((s) => s.runSimulation);
  const isSimulating = useCircuitStore((s) => s.isSimulating);
  const isDirty = useCircuitStore((s) => s.isDirty);
  const isSaving = useCircuitStore((s) => s.isSaving);
  const saveProject = useCircuitStore((s) => s.saveProject);
  const zoom = useCircuitStore((s) => s.zoom);
  const setZoom = useCircuitStore((s) => s.setZoom);
  const theme = useCircuitStore((s) => s.theme);
  const toggleTheme = useCircuitStore((s) => s.toggleTheme);
  const currentProject = useCircuitStore((s) => s.currentProject);
  const loadPreset = useCircuitStore((s) => s.loadPreset);
  const clearCircuit = useCircuitStore((s) => s.clearCircuit);
  const [selectedPresetVal, setSelectedPresetVal] = useState<string>("");

  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    if (val === "__clear__") {
      clearCircuit();
      setSelectedPresetVal("");
      return;
    }
    loadPreset(val);
    setSelectedPresetVal("");
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b select-none"
      style={{ background: "var(--ev-surface)", borderColor: "var(--ev-border)", minHeight: "44px" }}>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-600 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M11 1L4 12h5l-1 7 7-11h-5l1-7z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-bold text-sm tracking-tight" style={{ color: "var(--ev-text)" }}>
          Electro<span className="text-blue-600">Voltio</span>
        </span>
      </div>

      <Sep />

      {/* Projects */}
      <Btn onClick={onShowProjects} title="Administrador de proyectos">
        <IconFolder size={14} /> <span className="text-xs font-medium">Proyectos</span>
      </Btn>
      <Btn onClick={saveProject} disabled={!currentProject || !isDirty || isSaving} title="Guardar cambios en el servidor (Ctrl+S)">
        <IconSave size={14} />
        <span className="text-xs font-medium">{isSaving ? "Guardando…" : "Guardar"}</span>
      </Btn>

      <Sep />

      {/* Tools */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-md gap-0.5 border border-slate-200 dark:border-slate-700">
        {tools.map((tool) => (
          <Btn key={tool.id} onClick={() => setActiveTool(tool.id)}
            active={activeTool === tool.id} title={tool.label}>
            <tool.Icon size={14} />
          </Btn>
        ))}
      </div>

      <Sep />

      {/* Undo / Redo */}
      <Btn onClick={undo} disabled={historyIndex <= 0} title="Deshacer (Ctrl+Z)">
        <IconUndo size={14} />
      </Btn>
      <Btn onClick={redo} disabled={historyIndex >= historyLength - 1} title="Rehacer (Ctrl+Shift+Z)">
        <IconRedo size={14} />
      </Btn>

      <Sep />

      {/* Zoom */}
      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
        <Btn onClick={() => setZoom(zoom / 1.2)} title="Alejar (Zoom -)">
          <IconZoomOut size={13} />
        </Btn>
        <span className="text-[11px] px-1.5 min-w-10 text-center font-mono tabular-nums font-medium" style={{ color: "var(--ev-text-secondary)" }}>
          {Math.round(zoom * 100)}%
        </span>
        <Btn onClick={() => setZoom(zoom * 1.2)} title="Acercar (Zoom +)">
          <IconZoomIn size={13} />
        </Btn>
        <button
          onClick={() => setZoom(1)}
          title="Restablecer zoom al 100%"
          className="px-1.5 py-0.5 text-[10px] font-mono rounded hover:bg-white dark:hover:bg-slate-700 transition-colors"
          style={{ color: "var(--ev-text-secondary)" }}
        >
          1:1
        </button>
      </div>

      <div className="flex-1" />

      {/* PRESET SELECTOR (Right beside Simulate) */}
      <div className="flex items-center gap-1.5 mr-1">
        <div className="relative flex items-center">
          <select
            value={selectedPresetVal}
            onChange={handlePresetSelect}
            className="text-xs font-medium pl-2.5 pr-7 py-1.5 rounded-md border appearance-none cursor-pointer shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{
              background: "var(--ev-surface)",
              borderColor: "var(--ev-border)",
              color: "var(--ev-text)",
            }}
            title="Cargar instalación predefinida y verificada"
          >
            <option value="" disabled>Cargar modelo de instalación…</option>
            {ALL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} [{preset.badge}]
              </option>
            ))}
            <option disabled>──────────────────────────</option>
            <option value="__clear__">Limpiar lienzo (Circuito nuevo)</option>
          </select>
          <div className="pointer-events-none absolute right-2 flex items-center text-slate-400">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Simulate button */}
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-md font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          style={{ background: "#16a34a" }}
        >
          <IconPlay size={13} />
          {isSimulating ? "Simulando…" : "Simular"}
        </button>
      </div>

      <Sep />

      {/* Theme */}
      <Btn onClick={toggleTheme} title={theme === "light" ? "Modo oscuro" : "Modo claro"}>
        {theme === "light" ? <IconMoon size={14} /> : <IconSun size={14} />}
      </Btn>

      {/* Project name indicator */}
      {currentProject && (
        <span className="text-xs ml-1 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-medium" style={{ color: "var(--ev-text-secondary)" }}>
          {currentProject.name} <span className="opacity-70 text-[10px]">v{currentProject.version}</span>
          {isDirty && <span className="text-amber-500 ml-1">●</span>}
        </span>
      )}
    </div>
  );
}

// --- Mini components --------------------------------------------------------

function Sep() {
  return <div className="w-px h-6 mx-1" style={{ background: "var(--ev-border)" }} />;
}

function Btn({ children, onClick, disabled, active, title }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1 px-1.5 py-1.5 rounded transition-all disabled:opacity-30"
      style={{
        background: active ? "var(--ev-primary)" : "transparent",
        color: active ? "white" : "var(--ev-text)",
      }}
    >
      {children}
    </button>
  );
}
