// ============================================================================
// ElectroVoltio - Inspector Panel
// Shows properties and simulation data for selected components
// ============================================================================

"use client";

import React from "react";
import { useCircuitStore } from "@/store";
import { getComponentModel } from "@/data/catalog";
import { getIconForType } from "@/components/icons";
import { getCableColor, getConductorKind, getConductorLabel, getDefaultCableColor, REBT_COLORS } from "@/utils/conductorColors";
import type { CableInstance, ComponentInstance } from "@/types/circuit";
import type { ComponentState } from "@/engine/types";

function getInstrumentVoltage(state?: ComponentState | null): number {
  if (!state) return 0;
  const vA = state.terminalVoltages["A"] ?? state.terminalVoltages["L"] ?? state.terminalVoltages["L_in"] ?? state.terminalVoltages["L1_in"] ?? state.terminalVoltages["CH1"] ?? 0;
  const vB = state.terminalVoltages["B"] ?? state.terminalVoltages["N"] ?? state.terminalVoltages["N_in"] ?? state.terminalVoltages["CH2"] ?? 0;
  const diff = Math.abs(vA - vB);
  if (diff > 0.1) return diff;
  const maxV = Math.max(...Object.values(state.terminalVoltages), 0);
  return maxV;
}

function getInstrumentMainDisplay(comp: ComponentInstance, state?: ComponentState | null): string {
  if (!state) return "0.00 --";
  const voltage = getInstrumentVoltage(state);
  const current = state.totalCurrent;
  const power = state.totalPower;

  switch (comp.typeId) {
    case "voltmeter":
      return `${voltage.toFixed(2)} V`;
    case "ammeter":
    case "clamp_meter":
      return `${current.toFixed(3)} A`;
    case "wattmeter":
      return power >= 1000 ? `${(power / 1000).toFixed(3)} kW` : `${power.toFixed(1)} W`;
    case "varmeter":
      return `${state.totalReactivePower.toFixed(1)} VAR`;
    case "frequencymeter":
      return voltage > 10 ? "50.00 Hz" : "0.00 Hz";
    case "energy_meter":
      return `${power.toFixed(1)} W · 0.04 kWh`;
    case "network_analyzer_1p":
      return `${voltage.toFixed(1)}V · ${current.toFixed(2)}A · ${power.toFixed(0)}W`;
    case "network_analyzer_3p":
      return `${voltage.toFixed(1)}V 3F · ${current.toFixed(2)}A`;
    case "earth_tester":
      return "0.15 Ω (PE OK)";
    case "oscilloscope":
      return voltage > 10 ? "Vpp: 325V · 50Hz" : "0.00 Vpp";
    default:
      return `${voltage.toFixed(1)} V · ${current.toFixed(2)} A`;
  }
}

export default function Inspector() {
  const selectedComponentIds = useCircuitStore((s) => s.selectedComponentIds);
  const selectedCableId = useCircuitStore((s) => s.selectedCableId);
  const components = useCircuitStore((s) => s.components);
  const cables = useCircuitStore((s) => s.cables);
  const simulationResult = useCircuitStore((s) => s.simulationResult);
  const setComponentFault = useCircuitStore((s) => s.setComponentFault);
  const setMechanicalState = useCircuitStore((s) => s.setMechanicalState);
  const toggleProgrammer = useCircuitStore((s) => s.toggleProgrammer);
  const toggleComponentPower = useCircuitStore((s) => s.toggleComponentPower);
  const startTimedProgram = useCircuitStore((s) => s.startTimedProgram);
  const stopTimedProgram = useCircuitStore((s) => s.stopTimedProgram);
  const setDimmerLevel = useCircuitStore((s) => s.setDimmerLevel);
  const setSmokeAlarm = useCircuitStore((s) => s.setSmokeAlarm);
  const ringDoorbell = useCircuitStore((s) => s.ringDoorbell);
  const rotateComponent = useCircuitStore((s) => s.rotateComponent);
  const removeComponent = useCircuitStore((s) => s.removeComponent);
  const setCableColor = useCircuitStore((s) => s.setCableColor);

  // Single component selected
  const selectedId = selectedComponentIds.size === 1
    ? Array.from(selectedComponentIds)[0]
    : null;

  const comp = selectedId ? components.find((c) => c.id === selectedId) : null;
  const cable = selectedCableId ? cables.find((c) => c.id === selectedCableId) : null;

  const model = comp ? getComponentModel(comp.typeId) : null;
  const compState = comp ? simulationResult?.componentStates[comp.id] : null;
  const cableState = cable ? simulationResult?.cableStates[cable.id] : null;

  return (
    <div
      className="w-72 border-l overflow-y-auto"
      style={{ background: "var(--ev-surface)", borderColor: "var(--ev-border)" }}
    >
      <div className="p-3">
        <div className="text-xs font-bold mb-2" style={{ color: "var(--ev-text-secondary)" }}>
          INSPECTOR
        </div>

        {/* No selection */}
        {!comp && !cable && (
          <div className="text-xs" style={{ color: "var(--ev-text-secondary)" }}>
            Selecciona un componente o cable para ver sus propiedades.
          </div>
        )}

        {/* Component selected */}
        {comp && model && (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--ev-text-secondary)" }}>{React.createElement(getIconForType(comp.typeId), { size: 24 })}</span>
              <div>
                <div className="text-sm font-semibold">{model.name}</div>
                <div className="text-[10px]" style={{ color: "var(--ev-text-secondary)" }}>
                  {model.typeId}
                </div>
              </div>
            </div>

            {/* Mechanical State */}
            <Section title="ESTADO MECÁNICO">
              <div className="flex items-center gap-2">
                <StateBadge state={comp.mechanicalState} />
                {model.protection && (
                  <div className="flex gap-1">
                    {comp.mechanicalState === "TRIPPED" || comp.mechanicalState === "BLOWN" ? (
                      <button
                        onClick={() => setMechanicalState(comp.id, "CLOSED")}
                        className="px-2 py-0.5 text-[10px] rounded"
                        style={{ background: "var(--ev-success)", color: "white" }}
                      >
                        Rearmar
                      </button>
                    ) : (
                      <button
                        onClick={() => setMechanicalState(comp.id, "OPEN")}
                        className="px-2 py-0.5 text-[10px] rounded"
                        style={{ background: "var(--ev-warning)", color: "white" }}
                      >
                        Abrir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* Instrument Digital Panel */}
            {model.category === "instrument" && (
              <Section title="PANEL DE INSTRUMENTACIÓN DIGITAL">
                <div className="space-y-2">
                  {/* Digital Display Bezel */}
                  <div className="p-2.5 rounded-lg border border-slate-700 bg-slate-950 shadow-inner flex flex-col items-center justify-center">
                    <div className="text-[9px] font-mono tracking-widest text-sky-400/80 mb-0.5 uppercase">
                      {model.name} · TRUE RMS
                    </div>
                    <div className="text-xl font-bold font-mono tracking-wider text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                      {getInstrumentMainDisplay(comp, compState)}
                    </div>
                    <div className="flex items-center justify-between w-full text-[9px] text-slate-400 mt-1 font-mono pt-1 border-t border-slate-800">
                      <span>50.0 Hz</span>
                      <span>AUTO-RANGE</span>
                      <span className="text-emerald-400">HOLD: OFF</span>
                    </div>
                  </div>

                  {/* Secondary Measured Parameters */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                    <DataRow label="Tensión eficaz (V)" value={`${getInstrumentVoltage(compState).toFixed(2)} V`} />
                    <DataRow label="Intensidad eficaz (I)" value={`${(compState?.totalCurrent || 0).toFixed(3)} A`} />
                    <DataRow label="Potencia activa (P)" value={`${(compState?.totalPower || 0).toFixed(1)} W`} />
                    <DataRow label="Potencia reactiva (Q)" value={`${(compState?.totalReactivePower || 0).toFixed(1)} VAR`} />
                    <DataRow label="Factor de potencia (cos φ)" value={(compState?.powerFactor || 1).toFixed(3)} />
                    <DataRow label="Norma de seguridad" value={model.normativeReferences?.[0] || "IEC 61010-1 CAT III"} />
                  </div>
                </div>
              </Section>
            )}

            {/* Electrical State */}
            {compState && model.category !== "instrument" && (
              <Section title="ESTADO ELÉCTRICO">
                <div className="space-y-1">
                  <StateBadge state={compState.electrical} />
                  <DataRow label="Corriente" value={`${compState.totalCurrent.toFixed(2)} A`} />
                  <DataRow label="Potencia" value={`${compState.totalPower.toFixed(1)} W`} />
                  <DataRow label="Reactiva" value={`${compState.totalReactivePower.toFixed(1)} VAR`} />
                  <DataRow label="Factor potencia" value={compState.powerFactor.toFixed(2)} />
                  {compState.protectionTripped && (
                    <div className="text-[10px] px-2 py-1 rounded" style={{ background: "#fef2f2", color: "var(--ev-danger)" }}>
                      ⚠ {compState.tripReason || "Disparado"}
                      {compState.tripTime !== undefined && ` (${(compState.tripTime * 1000).toFixed(0)}ms)`}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Thermal State */}
            {compState && (
              <Section title="ESTADO TÉRMICO">
                <div className="space-y-1">
                  <StateBadge state={compState.thermal} />
                  <DataRow label="Temperatura" value={`${compState.temperature.toFixed(1)} °C`} />
                </div>
              </Section>
            )}

            {/* Terminal Voltages */}
            {compState && Object.keys(compState.terminalVoltages).length > 0 && (
              <Section title="TENSIONES DE TERMINAL">
                <div className="space-y-0.5">
                  {Object.entries(compState.terminalVoltages).map(([termId, voltage]) => (
                    <DataRow
                      key={termId}
                      label={termId}
                      value={`${voltage.toFixed(1)} V`}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Fault Injection */}
            <Section title="FALLOS">
              <div className="space-y-1">
                <select
                  value={comp.fault}
                  onChange={(e) => setComponentFault(comp.id, e.target.value as typeof comp.fault)}
                  className="w-full px-2 py-1 text-xs rounded border"
                  style={{
                    background: "var(--ev-bg)",
                    borderColor: "var(--ev-border)",
                    color: "var(--ev-text)",
                  }}
                >
                  <option value="NONE">Sin fallo</option>
                  <option value="OPEN">Circuito abierto</option>
                  <option value="SHORT">Cortocircuito</option>
                  <option value="LEAK">Fuga a tierra</option>
                  <option value="OVERVOLTAGE">Sobretensión</option>
                  <option value="UNDERVOLTAGE">Subtensión</option>
                 </select>

                 {comp.fault === "SHORT" && (
                   <DataRow
                     label="Z defecto (Ω)"
                     value={String(comp.faultParameters?.impedance || 0.001)}
                   />
                 )}

                 {comp.fault === "LEAK" && (
                   <DataRow
                     label="Z fuga (Ω)"
                     value={String(comp.faultParameters?.impedance || 100)}
                   />
                 )}
               </div>
             </Section>

            {/* Device controls for Residential, Loads and EV Charging */}
            {(model.category === "residential" || model.category === "load" || model.category === "ev_charging") && (
              <Section title="CONTROL DEL DISPOSITIVO">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span style={{ color: "var(--ev-text-secondary)" }}>Estado del circuito</span>
                    <span className="font-semibold">
                      {comp.mechanicalState === "OPEN" || comp.properties?.powered === false ? "ABIERTO / OFF" : "CERRADO / ON"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleComponentPower(comp.id)}
                    className="w-full px-2 py-1.5 text-xs rounded font-semibold text-white transition-all shadow-sm active:scale-95"
                    style={{ background: comp.mechanicalState === "OPEN" || comp.properties?.powered === false ? "#16a34a" : "#dc2626" }}
                  >
                    {comp.mechanicalState === "OPEN" || comp.properties?.powered === false ? "Encender / Cerrar circuito" : "Apagar / Abrir circuito"}
                  </button>

                  {(model.residentialControl?.isTimed || model.typeId === "load_timer") && (
                    <div className="space-y-1 rounded border p-2" style={{ borderColor: "var(--ev-border)" }}>
                      <div className="text-[10px] font-semibold">Temporización</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          defaultValue={Number(comp.properties?.timerDurationSec || model.residentialControl?.defaultDurationSec || 30)}
                          id={`timer-${comp.id}`}
                          className="w-20 px-2 py-1 text-xs rounded border"
                          style={{ background: "var(--ev-bg)", borderColor: "var(--ev-border)", color: "var(--ev-text)" }}
                        />
                        <span className="text-[10px]" style={{ color: "var(--ev-text-secondary)" }}>segundos</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="flex-1 px-2 py-1 text-[10px] rounded text-white bg-blue-600"
                          onClick={() => {
                            const input = document.getElementById(`timer-${comp.id}`) as HTMLInputElement | null;
                            const seconds = Number(input?.value || 30);
                            startTimedProgram(comp.id, seconds);
                          }}
                        >
                          Iniciar temporizador
                        </button>
                        <button
                          className="px-2 py-1 text-[10px] rounded border"
                          style={{ borderColor: "var(--ev-border)" }}
                          onClick={() => stopTimedProgram(comp.id)}
                        >
                          Parar
                        </button>
                      </div>
                      {typeof comp.properties?.timerEndsAt === "number" && (
                        <div className="text-[10px] text-sky-600">
                          Activo hasta {new Date(comp.properties.timerEndsAt as number).toLocaleTimeString("es")}
                        </div>
                      )}
                    </div>
                  )}

                  {model.residentialControl?.supportsDimmer && (
                    <div className="space-y-1">
                      <div className="text-[10px]" style={{ color: "var(--ev-text-secondary)" }}>
                        Nivel dimmer: {Number(comp.properties?.dimmerLevel ?? 80)}%
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Number(comp.properties?.dimmerLevel ?? 80)}
                        onChange={(e) => setDimmerLevel(comp.id, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {(model.residentialControl?.supportsSmoke || comp.typeId === "load_smoke_detector") && (
                    <button
                      onClick={() => setSmokeAlarm(comp.id, !comp.properties?.smokeDetected)}
                      className="w-full px-2 py-1.5 text-xs rounded font-semibold text-white"
                      style={{ background: comp.properties?.smokeDetected ? "#ea580c" : "#f59e0b" }}
                    >
                      {comp.properties?.smokeDetected ? "Detener simulación de humo" : "Simular humo"}
                    </button>
                  )}

                  {(model.residentialControl?.supportsBell || comp.typeId === "load_doorbell") && (
                    <button
                      onClick={() => ringDoorbell(comp.id)}
                      className="w-full px-2 py-1.5 text-xs rounded font-semibold text-white bg-indigo-600"
                    >
                      Activar timbre / intercomunicador
                    </button>
                  )}
                </div>
              </Section>
            )}

            {/* Timer programmer control (legacy alias) */}
            {comp.typeId === "load_timer" && !model.residentialControl && (
              <Section title="PROGRAMADOR HORARIO">
                <div className="space-y-1">
                  <button
                    onClick={() => toggleProgrammer(comp.id)}
                    className="w-full px-2 py-1 text-xs rounded hover:opacity-90"
                    style={{
                      background: comp.properties?.programActive !== false ? "var(--ev-success)" : "var(--ev-primary)",
                      color: "white",
                    }}
                  >
                    {comp.properties?.programActive !== false ? "Desactivar programa" : "Activar programa"}
                  </button>
                </div>
              </Section>
            )}

            {/* Terminals */}
            <Section title="TERMINALES">
              <div className="space-y-0.5">
                {model.terminals.map((term) => (
                  <div key={term.id} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          term.phase === "PE" ? "var(--ev-pe)" :
                          term.phase === "N" ? "var(--ev-neutral)" :
                          term.role === "positive" ? "#C62828" :
                          term.role === "negative" ? "#1565C0" :
                          "var(--ev-phase)",
                      }}
                    />
                    <span className="text-[10px]">{term.name}</span>
                    <span className="text-[10px] ml-auto" style={{ color: "var(--ev-text-secondary)" }}>
                      {term.phase}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Actions */}
            <div className="flex gap-1.5 pt-2">
              <button
                onClick={() => rotateComponent(comp.id)}
                className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: "var(--ev-border)" }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1.5 8a6.5 6.5 0 0 1 11.33-4M14.5 8a6.5 6.5 0 0 1-11.33 4" strokeLinecap="round" />
                  <path d="M12.5 1v3h-3M3.5 15v-3h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Rotar (R)
              </button>
              <button
                onClick={() => removeComponent(comp.id)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 0 1 1.34-1.34h2.66a1.33 1.33 0 0 1 1.34 1.34V4m2 0v9.33a1.33 1.33 0 0 1-1.34 1.34H4.67a1.33 1.33 0 0 1-1.34-1.34V4" strokeLinecap="round" />
                </svg>
                Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Cable selected */}
        {cable && (
          <div className="space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <CableIcon size={18} /> Cable
            </div>
            <Section title="CABLE">
              <DataRow label="Conductor" value={getConductorLabel(getConductorKind(cable, components))} />
              <DataRow label="Waypoints" value={String(cable.waypoints.length)} />
              <div className="text-[9px] leading-tight rounded px-2 py-1" style={{ background: "var(--ev-bg)", color: "var(--ev-text-secondary)" }}>
                Doble clic sobre el cable para añadir. Arrastra un punto para moverlo; clic derecho o Delete para eliminarlo.
              </div>
              <CableColorPicker
                cable={cable}
                components={components}
                onChange={(color) => setCableColor(cable.id, color)}
              />
              <DataRow label="Sección" value={`${cable.cable.crossSection} mm²`} />
              <DataRow label="Material" value={cable.cable.conductorMaterial} />
              <DataRow label="Longitud" value={`${cable.cable.length} m`} />
              <DataRow label="Aislamiento" value={cable.cable.insulationType} />
            </Section>

            {cableState && (
              <Section title="ESTADO">
                <DataRow label="Corriente" value={`${cableState.current.toFixed(2)} A`} />
                <DataRow label="Caída tensión" value={`${cableState.voltageDrop.toFixed(2)} V`} />
                <DataRow label="Pérdidas" value={`${cableState.powerLoss.toFixed(2)} W`} />
                <DataRow label="Carga" value={`${cableState.loading.toFixed(0)} %`} />
                <DataRow label="Temperatura" value={`${cableState.temperature.toFixed(1)} °C`} />
                {cableState.isOverloaded && (
                  <div className="text-[10px] px-2 py-1 rounded" style={{ background: "#fef2f2", color: "var(--ev-danger)" }}>
                    ⚠ Cable sobrecargado
                  </div>
                )}
              </Section>
            )}
          </div>
        )}

        {/* Simulation Summary */}
        {simulationResult && (
          <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--ev-border)" }}>
            <Section title="RESUMEN SIMULACIÓN">
              <div className="space-y-1">
                <DataRow
                  label="Convergencia"
                  value={simulationResult.converged ? "Convergido (OK)" : "No convergido (Error)"}
                />
                <DataRow
                  label="Potencia total"
                  value={`${simulationResult.summary.totalActivePower.toFixed(0)} W`}
                />
                <DataRow
                  label="Reactiva"
                  value={`${simulationResult.summary.totalReactivePower.toFixed(0)} VAR`}
                />
                <DataRow
                  label="Corriente fuente"
                  value={`${simulationResult.summary.sourceCurrent.toFixed(1)} A`}
                />
                <DataRow
                  label="Cargas activas"
                  value={String(simulationResult.summary.energizedLoads)}
                />
                {simulationResult.summary.activeFaults > 0 && (
                  <DataRow
                    label="Fallos activos"
                    value={String(simulationResult.summary.activeFaults)}
                  />
                )}
                {simulationResult.summary.trippedProtections > 0 && (
                  <DataRow
                    label="Protecciones"
                    value={`${simulationResult.summary.trippedProtections} disparadas`}
                  />
                )}
              </div>
            </Section>

            {/* Violations */}
            {simulationResult.violations.length > 0 && (
              <Section title="VALIDACIÓN NORMATIVA">
                <div className="space-y-1">
                  {simulationResult.violations.map((v, i) => (
                    <div
                      key={i}
                      className="text-[10px] px-2 py-1 rounded border flex items-start gap-1"
                      style={{
                        background: v.severity === "violation" ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
                        borderColor: v.severity === "violation" ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.25)",
                        color: v.severity === "violation" ? "#dc2626" : "#d97706",
                      }}
                    >
                      <span className="font-bold">{v.severity === "violation" ? "[INCUMPLIMIENTO]" : "[AVISO]"}</span>
                      <span>{v.message}</span>
                      {v.reference && <span className="ml-auto opacity-70 font-mono text-[9px]">({v.reference})</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Cable visual controls --------------------------------------------------

function CableIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9h12" strokeLinecap="round" />
      <circle cx="3" cy="9" r="2" fill="currentColor" />
      <circle cx="15" cy="9" r="2" fill="currentColor" />
    </svg>
  );
}

const CABLE_PALETTE = [
  { name: "Marrón · fase", value: REBT_COLORS.phase },
  { name: "Negro · fase alternativa", value: REBT_COLORS.phaseBlack },
  { name: "Gris · fase alternativa", value: REBT_COLORS.phaseGrey },
  { name: "Azul claro · neutro", value: REBT_COLORS.neutral },
  { name: "Verde · PE", value: REBT_COLORS.protective },
  { name: "Rojo", value: "#C62828" },
  { name: "Naranja", value: "#EF6C00" },
  { name: "Morado", value: "#7B1FA2" },
  { name: "Blanco", value: "#F8FAFC" },
  { name: "Gris oscuro", value: "#475569" },
];

function CableColorPicker({
  cable,
  components,
  onChange,
}: {
  cable: CableInstance;
  components: ComponentInstance[];
  onChange: (color: string | undefined) => void;
}) {
  const defaultColor = getDefaultCableColor(cable, components);
  const currentColor = getCableColor(cable, components);
  const conductor = getConductorKind(cable, components);
  const previewBackground = !cable.visualColor && conductor === "protective"
    ? `linear-gradient(90deg, ${REBT_COLORS.protective} 0 42%, ${REBT_COLORS.protectiveYellow} 42% 58%, ${REBT_COLORS.protective} 58%)`
    : currentColor;

  return (
    <div className="mt-2 space-y-2" aria-label="Color visual del cable">
      <div className="flex items-center justify-between text-[10px]">
        <span style={{ color: "var(--ev-text-secondary)" }}>Color visual</span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="inline-block w-8 h-3 rounded-sm border" style={{ background: previewBackground, borderColor: "var(--ev-border)" }} aria-label={`Vista previa ${currentColor}`} />
          {cable.visualColor ? "Personalizado" : getConductorLabel(conductor)}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Paleta de colores del cable">
        {CABLE_PALETTE.map((color) => (
          <button
            type="button"
            key={color.value}
            onClick={() => onChange(color.value)}
            title={color.name}
            aria-label={color.name}
            aria-pressed={cable.visualColor === color.value}
            className="h-6 rounded border transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: color.value, borderColor: color.value === "#F8FAFC" ? "var(--ev-border)" : color.value }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] flex-1" style={{ color: "var(--ev-text-secondary)" }}>
          <span>Personalizado</span>
          <input
            type="color"
            value={currentColor.startsWith("#") ? currentColor : defaultColor}
            onChange={(event) => onChange(event.target.value)}
            aria-label="Elegir color personalizado del cable"
            className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          disabled={!cable.visualColor}
          className="px-2 py-1 text-[10px] rounded border disabled:opacity-40 hover:opacity-80"
          style={{ borderColor: "var(--ev-border)" }}
        >
          Restaurar REBT
        </button>
      </div>
      <div className="text-[9px] leading-tight" style={{ color: "var(--ev-text-secondary)" }}>
        El color solo cambia la representación. Las conexiones y la simulación no se modifican.
      </div>
    </div>
  );
}

// --- Helper components ------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] font-bold mb-1 pb-0.5 border-b"
        style={{ color: "var(--ev-text-secondary)", borderColor: "var(--ev-border)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[10px] py-0.5">
      <span style={{ color: "var(--ev-text-secondary)" }}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    ENERGIZED: { bg: "#dcfce7", color: "#16a34a" },
    DEENERGIZED: { bg: "#f1f5f9", color: "#64748b" },
    OVERLOAD: { bg: "#fef3c7", color: "#d97706" },
    SHORT_CIRCUIT: { bg: "#fef2f2", color: "#dc2626" },
    EARTH_FAULT: { bg: "#fef3c7", color: "#d97706" },
    OVERVOLTAGE: { bg: "#fef3c7", color: "#d97706" },
    UNDERVOLTAGE: { bg: "#eff6ff", color: "#3b82f6" },
    CLOSED: { bg: "#dcfce7", color: "#16a34a" },
    OPEN: { bg: "#f1f5f9", color: "#64748b" },
    TRIPPED: { bg: "#fef2f2", color: "#dc2626" },
    BLOWN: { bg: "#fef2f2", color: "#dc2626" },
    WELDED: { bg: "#fef2f2", color: "#dc2626" },
    FAILED: { bg: "#fef2f2", color: "#dc2626" },
    NORMAL: { bg: "#dcfce7", color: "#16a34a" },
    WARM: { bg: "#fef3c7", color: "#d97706" },
    HOT: { bg: "#fee2e2", color: "#dc2626" },
    OVERHEATED: { bg: "#fef2f2", color: "#dc2626" },
  };

  const style = colors[state] || { bg: "#f1f5f9", color: "#64748b" };

  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] rounded font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {state}
    </span>
  );
}

function getCategoryIcon(_category: string): string {
  return "";
}
