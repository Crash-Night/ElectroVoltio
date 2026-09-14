// ============================================================================
// ElectroVoltio - Event Log Component (SVG icons)
// ============================================================================

"use client";

import { useState } from "react";
import { useCircuitStore } from "@/store";

export default function EventLog() {
  const eventLog = useCircuitStore((s) => s.eventLog);
  const [isExpanded, setIsExpanded] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const severityStyles: Record<string, { color: string; icon: React.ReactNode }> = {
    info: { color: "#38bdf8", icon: <Dot color="#38bdf8" /> },
    warning: { color: "#f59e0b", icon: <Triangle color="#f59e0b" /> },
    alarm: { color: "#ef4444", icon: <Bell color="#ef4444" /> },
    critical: { color: "#dc2626", icon: <AlertOctagon color="#dc2626" /> },
  };

  const filteredEvents = severityFilter === "all"
    ? eventLog
    : eventLog.filter((e) => e.severity === severityFilter || (severityFilter === "alarm" && (e.severity === "alarm" || e.severity === "critical")));

  const visibleEvents = isExpanded ? filteredEvents : filteredEvents.slice(0, 3);

  return (
    <div
      className="border-t overflow-hidden transition-all select-none"
      style={{ borderColor: "var(--ev-border)", background: "var(--ev-surface)", maxHeight: isExpanded ? "220px" : "auto" }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        style={{ borderBottom: isExpanded ? "1px solid var(--ev-border)" : "none" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: "var(--ev-text-secondary)" }}>
            <ListIcon size={12} /> Registro de Eventos ({eventLog.length})
          </span>

          {/* Quick Filters */}
          {isExpanded && (
            <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
              {[
                { id: "all", label: "Todos" },
                { id: "alarm", label: "Disparos / Fallos" },
                { id: "warning", label: "Avisos" },
                { id: "info", label: "Info" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSeverityFilter(f.id)}
                  className={`px-1.5 py-0.2 text-[9px] rounded font-medium transition-colors ${
                    severityFilter === f.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>{isExpanded ? "Ocultar panel" : "Ver registro completo"}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            <path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {visibleEvents.length > 0 && (
        <div className={`px-3 py-1 space-y-0.5 ${isExpanded ? "overflow-y-auto" : ""}`}>
          {visibleEvents.map((event) => {
            const style = severityStyles[event.severity] || severityStyles.info;
            return (
              <div key={event.id} className="flex items-start gap-1.5 text-[10px]">
                <span className="flex-shrink-0 mt-0.5">{style.icon}</span>
                <span className="font-mono font-semibold" style={{ color: style.color }}>[{event.type}]</span>
                <span style={{ color: "var(--ev-text)" }}>{event.message}</span>
                <span className="ml-auto flex-shrink-0" style={{ color: "var(--ev-text-secondary)" }}>
                  {new Date(event.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {eventLog.length === 0 && (
        <div className="px-3 py-1 text-[10px]" style={{ color: "var(--ev-text-secondary)" }}>
          Sin eventos.
        </div>
      )}
    </div>
  );
}

// --- Mini SVG icons ---------------------------------------------------------

function ListIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 3h8M2 6h8M2 9h8" strokeLinecap="round" />
    </svg>
  );
}

function Dot({ color }: { color: string }) {
  return <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill={color} /></svg>;
}

function Triangle({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill={color}>
      <path d="M5 1L9 9H1L5 1z" />
      <text x="5" y="7.5" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">!</text>
    </svg>
  );
}

function Bell({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color} strokeWidth="1">
      <path d="M5 1.5a3 3 0 0 0-3 3c0 1.5-1 2.5-1 2.5h8S8.5 6 8 4.5a3 3 0 0 0-3-3z" />
      <path d="M4 8h2" strokeLinecap="round" />
    </svg>
  );
}

function AlertOctagon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color} strokeWidth="1">
      <path d="M3.5 1h3l3 3v3l-3 3h-3l-3-3v-3l3-3z" />
      <path d="M5 3.5v2" strokeLinecap="round" />
      <circle cx="5" cy="7" r="0.5" fill={color} />
    </svg>
  );
}
