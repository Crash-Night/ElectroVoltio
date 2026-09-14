// ============================================================================
// ElectroVoltio - Status Bar Component (SVG icons)
// ============================================================================

"use client";

import { useCircuitStore } from "@/store";

export default function StatusBar() {
  const currentProject = useCircuitStore((s) => s.currentProject);
  const components = useCircuitStore((s) => s.components);
  const cables = useCircuitStore((s) => s.cables);
  const isDirty = useCircuitStore((s) => s.isDirty);
  const isSaving = useCircuitStore((s) => s.isSaving);
  const lastSaveError = useCircuitStore((s) => s.lastSaveError);
  const simulationResult = useCircuitStore((s) => s.simulationResult);
  const isSimulating = useCircuitStore((s) => s.isSimulating);
  const zoom = useCircuitStore((s) => s.zoom);
  const activeTool = useCircuitStore((s) => s.activeTool);

  return (
    <div
      className="flex items-center justify-between px-3 py-1 text-[10px] border-t"
      style={{
        background: "var(--ev-surface)",
        borderColor: "var(--ev-border)",
        color: "var(--ev-text-secondary)",
        minHeight: "24px",
      }}
    >
      {/* Left: Save status */}
      <div className="flex items-center gap-2.5 font-mono">
        {currentProject ? (
          isSaving ? (
            <span className="flex items-center gap-1 text-sky-500 font-sans">
              <SpinnerIcon size={10} /> Guardando…
            </span>
          ) : lastSaveError ? (
            <span className="flex items-center gap-1 font-sans" style={{ color: "var(--ev-danger)" }}>
              <XIcon size={10} /> {lastSaveError}
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1 font-sans" style={{ color: "var(--ev-warning)" }}>
              <CircleIcon size={7} fill="var(--ev-warning)" /> Modificado
            </span>
          ) : (
            <span className="flex items-center gap-1 font-sans" style={{ color: "var(--ev-success)" }}>
              <CheckIcon size={10} /> Guardado
            </span>
          )
        ) : (
          <span className="font-sans">Memoria local</span>
        )}
        <Sep />
        <span>{components.length} comps</span>
        <span>·</span>
        <span>{cables.length} cables</span>
      </div>

      {/* Center: Live Telemetry */}
      <div className="flex items-center gap-2.5 font-mono">
        {isSimulating ? (
          <span className="flex items-center gap-1 text-sky-500 font-sans">
            <SpinnerIcon size={10} /> Calculando flujo de cargas…
          </span>
        ) : simulationResult ? (
          simulationResult.converged ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                <BoltIcon size={10} />
                {simulationResult.summary.energizedLoads} cargas ON
              </span>
              <span>·</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {simulationResult.summary.totalActivePower >= 1000
                  ? `${(simulationResult.summary.totalActivePower / 1000).toFixed(2)} kW`
                  : `${simulationResult.summary.totalActivePower.toFixed(0)} W`}
              </span>
              <span>·</span>
              <span>{simulationResult.summary.sourceCurrent.toFixed(2)} A</span>
              {simulationResult.violations.length > 0 && (
                <>
                  <span>·</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-600 font-sans font-semibold">
                    {simulationResult.violations.length} {simulationResult.violations.length === 1 ? "aviso" : "avisos"} REBT
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1 font-sans" style={{ color: "var(--ev-danger)" }}>
              <XIcon size={10} /> Simulación divergente
            </span>
          )
        ) : (
          <span className="font-sans">Circuito listo para simulación</span>
        )}
      </div>

      {/* Right: Tool & zoom */}
      <div className="flex items-center gap-3">
        <span>Herramienta: {activeTool}</span>
        <Sep />
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="opacity-30">|</span>;
}

function SpinnerIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className="animate-spin">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M5 1a4 4 0 0 1 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
    </svg>
  );
}

function CircleIcon({ size = 8, fill = "currentColor" }: { size?: number; fill?: string }) {
  return <svg width={size} height={size} viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill={fill} /></svg>;
}

function BoltIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
      <path d="M6 1L3 5.5h2L4 9l3-4.5H5L6 1z" />
    </svg>
  );
}
