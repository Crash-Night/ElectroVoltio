// ============================================================================
// ElectroVoltio - SVG Canvas Component (with SVG icons)
// ============================================================================

"use client";

import { createElement, useRef, useCallback, useState } from "react";
import { useCircuitStore } from "@/store";
import { getComponentModel } from "@/data/catalog";
import { getIconForType } from "@/components/icons";
import { getCableColor, getConductorKind, REBT_COLORS, PE_GRADIENT_ID } from "@/utils/conductorColors";
import { getTerminalAbsolutePosition, getTerminalLocalPosition } from "@/utils/terminalGeometry";
import type { ComponentInstance, CableInstance } from "@/types/circuit";
import type { ComponentState, CableState } from "@/engine/types";

const GRID_SIZE = 20;
const COMPONENT_SIZE = 80;
const TERMINAL_RADIUS = 5;

export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const components = useCircuitStore((s) => s.components);
  const cables = useCircuitStore((s) => s.cables);
  const selectedComponentIds = useCircuitStore((s) => s.selectedComponentIds);
  const selectedCableId = useCircuitStore((s) => s.selectedCableId);
  const selectedWaypoint = useCircuitStore((s) => s.selectedWaypoint);
  const activeTool = useCircuitStore((s) => s.activeTool);
  const placingTypeId = useCircuitStore((s) => s.placingTypeId);
  const wireDrawing = useCircuitStore((s) => s.wireDrawing);
  const simulationResult = useCircuitStore((s) => s.simulationResult);
  const zoom = useCircuitStore((s) => s.zoom);
  const panX = useCircuitStore((s) => s.panX);
  const panY = useCircuitStore((s) => s.panY);
  const showGrid = useCircuitStore((s) => s.showGrid);

  const addComponent = useCircuitStore((s) => s.addComponent);
  const moveComponent = useCircuitStore((s) => s.moveComponent);
  const selectComponent = useCircuitStore((s) => s.selectComponent);
  const selectCable = useCircuitStore((s) => s.selectCable);
  const clearSelection = useCircuitStore((s) => s.clearSelection);
  const removeComponent = useCircuitStore((s) => s.removeComponent);
  const removeCable = useCircuitStore((s) => s.removeCable);
  const setPan = useCircuitStore((s) => s.setPan);
  const setZoom = useCircuitStore((s) => s.setZoom);
  const setWireDrawing = useCircuitStore((s) => s.setWireDrawing);
  const addCable = useCircuitStore((s) => s.addCable);
  const addCableWaypoint = useCircuitStore((s) => s.addCableWaypoint);
  const updateCableWaypoint = useCircuitStore((s) => s.updateCableWaypoint);
  const removeCableWaypoint = useCircuitStore((s) => s.removeCableWaypoint);
  const selectWaypoint = useCircuitStore((s) => s.selectWaypoint);
  const setMechanicalState = useCircuitStore((s) => s.setMechanicalState);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    componentId: string | null;
    offsetX: number;
    offsetY: number;
  }>({ isDragging: false, componentId: null, offsetX: 0, offsetY: 0 });

  const [panState, setPanState] = useState({ isPanning: false, startX: 0, startY: 0 });
  const [waypointDrag, setWaypointDrag] = useState<{ cableId: string; index: number } | null>(null);

  const screenToSVG = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left - panX) / zoom, y: (clientY - rect.top - panY) / zoom };
    },
    [zoom, panX, panY]
  );

  const snapToGrid = useCallback((val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && activeTool === "pan")) {
        setPanState({ isPanning: true, startX: e.clientX - panX, startY: e.clientY - panY });
        return;
      }
      if (e.button !== 0) return;
      const { x, y } = screenToSVG(e.clientX, e.clientY);

      if (activeTool === "place" && placingTypeId) {
        addComponent(placingTypeId, snapToGrid(x), snapToGrid(y));
        return;
      }
      if (activeTool === "wire" && !wireDrawing) return;
      clearSelection();
    },
    [activeTool, placingTypeId, wireDrawing, panX, panY, screenToSVG, snapToGrid, addComponent, clearSelection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panState.isPanning) { setPan(e.clientX - panState.startX, e.clientY - panState.startY); return; }
      if (waypointDrag) {
        const point = screenToSVG(e.clientX, e.clientY);
        updateCableWaypoint(waypointDrag.cableId, waypointDrag.index, {
          x: snapToGrid(point.x),
          y: snapToGrid(point.y),
        });
        return;
      }
      if (dragState.isDragging && dragState.componentId) {
        const { x, y } = screenToSVG(e.clientX, e.clientY);
        moveComponent(dragState.componentId, snapToGrid(x - dragState.offsetX), snapToGrid(y - dragState.offsetY));
        return;
      }
      if (wireDrawing) {
        const { x, y } = screenToSVG(e.clientX, e.clientY);
        setWireDrawing({ ...wireDrawing, currentX: x, currentY: y });
      }
    },
    [panState, waypointDrag, dragState, wireDrawing, screenToSVG, snapToGrid, moveComponent, updateCableWaypoint, setPan, setWireDrawing]
  );

  const handleMouseUp = useCallback(() => {
    setPanState((s) => ({ ...s, isPanning: false }));
    if (waypointDrag) {
      useCircuitStore.getState().pushHistory("Mover waypoint");
    }
    setWaypointDrag(null);
    setDragState({ isDragging: false, componentId: null, offsetX: 0, offsetY: 0 });
  }, [waypointDrag]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.1));
  }, [zoom, setZoom]);

  const handleComponentMouseDown = useCallback(
    (compId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeTool === "delete") { removeComponent(compId); return; }
      if (activeTool === "select") {
        selectComponent(compId, e.shiftKey);
        const { x, y } = screenToSVG(e.clientX, e.clientY);
        const comp = components.find((c) => c.id === compId);
        if (comp) setDragState({ isDragging: true, componentId: compId, offsetX: x - comp.x, offsetY: y - comp.y });
      }
    },
    [activeTool, components, screenToSVG, selectComponent, removeComponent]
  );

  const handleTerminalClick = useCallback(
    (compId: string, termId: string, x: number, y: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeTool !== "wire") return;
      if (!wireDrawing) {
        setWireDrawing({ fromComponentId: compId, fromTerminalId: termId, startX: x, startY: y, currentX: x, currentY: y });
      } else {
        if (wireDrawing.fromComponentId !== compId || wireDrawing.fromTerminalId !== termId) {
          addCable({ fromComponentId: wireDrawing.fromComponentId, fromTerminalId: wireDrawing.fromTerminalId, toComponentId: compId, toTerminalId: termId, waypoints: [] });
        }
        setWireDrawing(null);
      }
    },
    [activeTool, wireDrawing, setWireDrawing, addCable]
  );

  const handleCableClick = useCallback((cableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === "delete") removeCable(cableId); else selectCable(cableId);
  }, [activeTool, selectCable, removeCable]);

  const handleContextMenu = useCallback((compId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const comp = components.find((c) => c.id === compId);
    if (comp) {
      const model = getComponentModel(comp.typeId);
      if (model?.protection) {
        setMechanicalState(compId, comp.mechanicalState === "CLOSED" ? "OPEN" : "CLOSED");
      }
    }
  }, [components, setMechanicalState]);

  const getTerminalPosition = useCallback(
    (compId: string, termId: string) => {
      const comp = components.find((c) => c.id === compId);
      if (!comp) return { x: 0, y: 0 };
      const pos = getTerminalAbsolutePosition(comp, termId);
      return pos;
    },
    [components]
  );

  const handleCableDoubleClick = useCallback((cable: CableInstance, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button !== 0) return;
    const point = screenToSVG(e.clientX, e.clientY);
    const from = getTerminalPosition(cable.fromComponentId, cable.fromTerminalId);
    const to = getTerminalPosition(cable.toComponentId, cable.toTerminalId);
    const points = [from, ...cable.waypoints, to];
    let bestIndex = 0;
    let bestPoint = point;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let segment = 0; segment < points.length - 1; segment += 1) {
      const projection = projectPointToSegment(point, points[segment], points[segment + 1]);
      if (projection.distance < bestDistance) {
        bestDistance = projection.distance;
        bestPoint = projection.point;
        bestIndex = segment;
      }
    }

    addCableWaypoint(cable.id, { x: snapToGrid(bestPoint.x), y: snapToGrid(bestPoint.y) }, bestIndex);
  }, [screenToSVG, getTerminalPosition, addCableWaypoint, snapToGrid]);

  const handleWaypointMouseDown = useCallback((cableId: string, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectWaypoint(cableId, index);
    setWaypointDrag({ cableId, index });
  }, [selectWaypoint]);

  const handleWaypointContextMenu = useCallback((cableId: string, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeCableWaypoint(cableId, index);
  }, [removeCableWaypoint]);

  const getVisualState = useCallback((comp: ComponentInstance) => {
    if (!simulationResult) return { stroke: "var(--ev-component-border)", fill: "var(--ev-component-bg)" };
    const state = simulationResult.componentStates[comp.id];
    if (!state) return { stroke: "var(--ev-component-border)", fill: "var(--ev-component-bg)" };
    switch (state.electrical) {
      case "ENERGIZED": return { stroke: "#22c55e", fill: "#f0fdf4" };
      case "OVERLOAD": return { stroke: "#f59e0b", fill: "#fffbeb" };
      case "SHORT_CIRCUIT": case "EARTH_FAULT": return { stroke: "#ef4444", fill: "#fef2f2" };
      case "OVERVOLTAGE": return { stroke: "#f59e0b", fill: "#fffbeb" };
      case "UNDERVOLTAGE": return { stroke: "#3b82f6", fill: "#eff6ff" };
      default: return { stroke: "var(--ev-component-border)", fill: "var(--ev-component-bg)" };
    }
  }, [simulationResult]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{ background: "var(--ev-canvas-bg)", cursor: activeTool === "pan" ? "grab" : "default" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }}>
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Grid */}
          {showGrid && (
            <>
              <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="var(--ev-grid)" strokeWidth="0.5" />
                </pattern>
                <linearGradient id={PE_GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={REBT_COLORS.protective} />
                  <stop offset="42%" stopColor={REBT_COLORS.protective} />
                  <stop offset="50%" stopColor={REBT_COLORS.protectiveYellow} />
                  <stop offset="58%" stopColor={REBT_COLORS.protective} />
                  <stop offset="100%" stopColor={REBT_COLORS.protective} />
                </linearGradient>
              </defs>
              <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />
            </>
          )}

          {/* Cables */}
          {cables.map((cable) => (
            <CableRenderer
              key={cable.id}
              cable={cable}
              isSelected={selectedCableId === cable.id}
              cableState={simulationResult?.cableStates[cable.id]}
              components={components}
              selectedWaypoint={selectedWaypoint}
              getTerminalPos={getTerminalPosition}
              onClick={handleCableClick}
              onDoubleClick={handleCableDoubleClick}
              onWaypointMouseDown={handleWaypointMouseDown}
              onWaypointContextMenu={handleWaypointContextMenu}
            />
          ))}

          {/* Wire preview */}
          {wireDrawing && (
            <line x1={wireDrawing.startX} y1={wireDrawing.startY} x2={wireDrawing.currentX} y2={wireDrawing.currentY}
              stroke="var(--ev-primary)" strokeWidth={2} strokeDasharray="5,5" />
          )}

          {/* Components */}
          {components.map((comp) => (
            <ComponentRenderer
              key={comp.id}
              component={comp}
              isSelected={selectedComponentIds.has(comp.id)}
              componentState={simulationResult?.componentStates[comp.id]}
              visualState={getVisualState(comp)}
              onMouseDown={handleComponentMouseDown}
              onTerminalClick={handleTerminalClick}
              onContextMenu={handleContextMenu}
              activeTool={activeTool}
            />
          ))}
        </g>
      </svg>

      {/* Tool hints */}
      {activeTool === "place" && placingTypeId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 text-xs rounded-lg shadow-lg"
          style={{ background: "var(--ev-primary)", color: "white" }}>
          Click para colocar · ESC cancelar
        </div>
      )}
      {activeTool === "wire" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 text-xs rounded-lg shadow-lg"
          style={{ background: "var(--ev-primary)", color: "white" }}>
          Click en terminal para cablear · ESC cancelar
        </div>
      )}

      {/* REBT conductor legend: visual only */}
      <div className="absolute right-3 top-3 rounded-md border px-2.5 py-2 shadow-sm text-[10px] space-y-1"
        style={{ background: "var(--ev-surface)", borderColor: "var(--ev-border)", color: "var(--ev-text)" }}
        aria-label="Leyenda de colores REBT">
        <div className="font-semibold mb-1">Colores REBT</div>
        <LegendRow color="var(--ev-phase)" label="Fase / Línea (L)" />
        <LegendRow color="var(--ev-neutral)" label="Neutro (N)" />
        <LegendRow color="var(--ev-pe)" secondaryColor="var(--ev-pe-yellow)" label="Protección / Tierra (PE)" />
      </div>
    </div>
  );
}

function LegendRow({ color, secondaryColor, label }: { color: string; secondaryColor?: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-block h-1.5 w-5 rounded-full" style={{ background: secondaryColor ? `linear-gradient(90deg, ${color} 0 42%, ${secondaryColor} 42% 58%, ${color} 58%)` : color }} />
      <span>{label}</span>
    </div>
  );
}

function getInstrumentReading(component: ComponentInstance, state?: ComponentState): string {
  if (!state) return "0.0";
  const vA = state.terminalVoltages["A"] ?? state.terminalVoltages["L"] ?? state.terminalVoltages["L_in"] ?? state.terminalVoltages["L1_in"] ?? state.terminalVoltages["CH1"] ?? 0;
  const vB = state.terminalVoltages["B"] ?? state.terminalVoltages["N"] ?? state.terminalVoltages["N_in"] ?? state.terminalVoltages["CH2"] ?? 0;
  const vDiff = Math.abs(vA - vB);
  const current = state.totalCurrent;
  const power = state.totalPower;

  switch (component.typeId) {
    case "voltmeter":
      return `${vDiff.toFixed(1)} V`;
    case "ammeter":
    case "clamp_meter":
      return `${current.toFixed(2)} A`;
    case "wattmeter":
      return power >= 1000 ? `${(power / 1000).toFixed(2)} kW` : `${power.toFixed(0)} W`;
    case "varmeter":
      return `${state.totalReactivePower.toFixed(0)} VAR`;
    case "frequencymeter":
      return vDiff > 10 ? "50.0 Hz" : "0.0 Hz";
    case "energy_meter":
      return power >= 1000 ? `${(power / 1000).toFixed(2)} kW` : `${power.toFixed(0)} W`;
    case "network_analyzer_1p":
      return `${vDiff.toFixed(0)}V ${current.toFixed(1)}A`;
    case "network_analyzer_3p":
      return `${vDiff.toFixed(0)}V 3F`;
    case "earth_tester":
      return "0.15 Ω";
    case "oscilloscope":
      return vDiff > 10 ? "50 Hz ~" : "0.0 V";
    default:
      return `${current.toFixed(1)}A`;
  }
}

// --- Component Renderer (SVG icons) -----------------------------------------

function ComponentRenderer({
  component, isSelected, componentState, visualState, onMouseDown, onTerminalClick, onContextMenu, activeTool,
}: {
  component: ComponentInstance;
  isSelected: boolean;
  componentState?: ComponentState;
  visualState: { stroke: string; fill: string };
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onTerminalClick: (compId: string, termId: string, x: number, y: number, e: React.MouseEvent) => void;
  onContextMenu: (compId: string, e: React.MouseEvent) => void;
  activeTool: string;
}) {
  const model = getComponentModel(component.typeId);
  if (!model) return null;
  const x = component.x;
  const y = component.y;
  const rot = component.rotation;
  const halfSize = COMPONENT_SIZE / 2;
  const isTripped = componentState?.mechanical === "TRIPPED" || componentState?.mechanical === "BLOWN";
  const isOpen = componentState?.mechanical === "OPEN" || component.properties?.powered === false;
  const isWelded = componentState?.mechanical === "WELDED";
  const smokeActive = Boolean(component.properties?.smokeDetected);
  const ringing = Boolean(component.properties?.ringing);
  const isResidential = model.category === "residential";

  return (
    <g
      className={`component-group ${isSelected ? "selected" : ""} ${smokeActive ? "smoke-alert" : ""} ${ringing ? "doorbell-active" : ""}`}
      transform={`translate(${x}, ${y}) rotate(${rot})`}
      onMouseDown={(e) => onMouseDown(component.id, e)}
      onContextMenu={(e) => onContextMenu(component.id, e)}
    >
      {/* Background */}
      <rect x={-halfSize} y={-halfSize} width={COMPONENT_SIZE} height={COMPONENT_SIZE}
        rx={6}
        fill={smokeActive ? "#fff7ed" : ringing ? "#eef2ff" : visualState.fill}
        stroke={smokeActive ? "#f97316" : ringing ? "#6366f1" : isSelected ? "var(--ev-selected)" : visualState.stroke}
        strokeWidth={isSelected || smokeActive || ringing ? 2.8 : 1.5} />

      {/* SVG Icon centered */}
      <g transform={`translate(-14, -18)`} style={{ pointerEvents: "none" }}>
        {createElement(getIconForType(component.typeId), { size: 28, color: "var(--ev-text)" })}
      </g>

      {/* Name below icon */}
      <text x={0} y={model.category === "instrument" ? 14 : 20} textAnchor="middle" fontSize={8} fill="var(--ev-text-secondary)"
        style={{ pointerEvents: "none" }}>
        {model.name.length > 16 ? model.name.substring(0, 16) + "…" : model.name}
      </text>

      {/* Digital LCD screen for instruments */}
      {model.category === "instrument" && (
        <g transform={`translate(-30, 18)`} style={{ pointerEvents: "none" }}>
          <rect x={0} y={0} width={60} height={15} rx={2} fill="#09101d" stroke="#1e293b" strokeWidth={1} />
          <text x={30} y={10.5} textAnchor="middle" fontSize={8.5} fontWeight="bold" fontFamily="monospace"
            fill={componentState && (componentState.totalCurrent > 0.001 || Object.values(componentState.terminalVoltages).some(v => v > 10)) ? "#38bdf8" : "#475569"}>
            {getInstrumentReading(component, componentState) || "0.0"}
          </text>
        </g>
      )}

      {/* State indicators */}
      {(isTripped || isOpen || isWelded || isResidential) && (
        <g>
          <circle cx={halfSize - 10} cy={-halfSize + 10} r={6}
            fill={
              smokeActive ? "#f97316" :
              ringing ? "#6366f1" :
              isTripped ? "var(--ev-danger)" :
              isWelded ? "#dc2626" :
              isOpen ? "#94a3b8" :
              "#16a34a"
            } />
          <text x={halfSize - 10} y={-halfSize + 10} textAnchor="middle" dominantBaseline="central"
            fontSize={7} fill="white" fontWeight="bold">
            {smokeActive ? "!" : ringing ? "♪" : isTripped ? "T" : isWelded ? "W" : isOpen ? "OFF" : "ON"}
          </text>
        </g>
      )}

      {smokeActive && (
        <text x={0} y={-halfSize - 10} textAnchor="middle" fontSize={8} fill="#ea580c" fontWeight="bold">
          HUMO DETECTADO
        </text>
      )}
      {ringing && (
        <text x={0} y={-halfSize - 10} textAnchor="middle" fontSize={8} fill="#4f46e5" fontWeight="bold">
          TIMBRE ACTIVO
        </text>
      )}

      {/* Current measurement */}
      {componentState && componentState.totalCurrent > 0.001 && (
        <text x={0} y={halfSize + 12} textAnchor="middle" fontSize={7} fill="var(--ev-text-secondary)"
          style={{ pointerEvents: "none" }}>
          {componentState.totalCurrent.toFixed(2)}A
        </text>
      )}

      {/* Power */}
      {componentState && componentState.totalPower > 0.1 && (
        <text x={0} y={halfSize + 20} textAnchor="middle" fontSize={6} fill="var(--ev-text-secondary)"
          style={{ pointerEvents: "none" }}>
          {componentState.totalPower.toFixed(0)}W
        </text>
      )}

      {/* Terminals */}
      {model.terminals.map((term) => {
        const local = getTerminalLocalPosition(component.typeId, term.id);
        if (!local) return null;
        const tx = local.x;
        const ty = local.y;
        const termColor =
          term.phase === "PE" ? "var(--ev-pe)" :
          term.phase === "N" ? "var(--ev-neutral)" :
          term.role === "positive" ? "#C62828" :
          term.role === "negative" ? "#1565C0" :
          "var(--ev-phase)";
        const absX = x + tx * Math.cos(rot * Math.PI / 180) - ty * Math.sin(rot * Math.PI / 180);
        const absY = y + tx * Math.sin(rot * Math.PI / 180) + ty * Math.cos(rot * Math.PI / 180);
        return (
          <g key={term.id}>
            <circle cx={tx} cy={ty} r={TERMINAL_RADIUS}
              fill={termColor} stroke={term.phase === "PE" ? "var(--ev-pe-yellow)" : "white"} strokeWidth={1.5}
              className="terminal-dot"
              style={{ cursor: activeTool === "wire" ? "crosshair" : "pointer" }}
              onClick={(e) => onTerminalClick(component.id, term.id, absX, absY, e)} />
            <text x={tx + (tx < 0 ? -10 : 10)} y={ty}
              textAnchor={tx < 0 ? "end" : "start"} dominantBaseline="central"
              fontSize={5} fill="var(--ev-text-secondary)" style={{ pointerEvents: "none" }}>
              {term.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// --- Cable Renderer ---------------------------------------------------------

function CableRenderer({
  cable, isSelected, cableState, components, selectedWaypoint, getTerminalPos, onClick, onDoubleClick,
  onWaypointMouseDown, onWaypointContextMenu,
}: {
  cable: CableInstance;
  isSelected: boolean;
  cableState?: CableState;
  components: ComponentInstance[];
  selectedWaypoint: { cableId: string; index: number } | null;
  getTerminalPos: (compId: string, termId: string) => { x: number; y: number };
  onClick: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (cable: CableInstance, e: React.MouseEvent) => void;
  onWaypointMouseDown: (cableId: string, index: number, e: React.MouseEvent) => void;
  onWaypointContextMenu: (cableId: string, index: number, e: React.MouseEvent) => void;
}) {
  const from = getTerminalPos(cable.fromComponentId, cable.fromTerminalId);
  const to = getTerminalPos(cable.toComponentId, cable.toTerminalId);
  const points = [from, ...cable.waypoints, to];
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const current = cableState?.current || 0;
  const defaultColor = getCableColor(cable, components);
  const kind = getConductorKind(cable, components);
  const strokeColor = cable.visualColor ? defaultColor : kind === "protective" ? `url(#${PE_GRADIENT_ID})` : defaultColor;
  const strokeDasharray = cableState?.isOverloaded ? "4 3" : undefined;

  return (
    <g onClick={(e) => onClick(cable.id, e)} onDoubleClick={(e) => onDoubleClick(cable, e)}>
      <path d={pathD} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: "pointer" }} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={isSelected ? 2.8 : 2}
        strokeDasharray={strokeDasharray} className="cable-path" strokeLinecap="round" strokeLinejoin="round" />

      {/* Waypoint handles: editing is visual-only and never changes endpoints */}
      {isSelected && cable.waypoints.map((point, index) => {
        const selected = selectedWaypoint?.cableId === cable.id && selectedWaypoint.index === index;
        return (
          <g key={`${cable.id}-waypoint-${index}`}>
            <circle cx={point.x} cy={point.y} r={selected ? 7 : 5}
              fill="var(--ev-surface)" stroke={selected ? "var(--ev-primary)" : defaultColor}
              strokeWidth={selected ? 2.5 : 2} style={{ cursor: "move" }}
              onMouseDown={(e) => onWaypointMouseDown(cable.id, index, e)}
              onDoubleClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => onWaypointContextMenu(cable.id, index, e)} />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize={7}
              fill="var(--ev-text-secondary)" style={{ pointerEvents: "none" }}>
              {index + 1}
            </text>
          </g>
        );
      })}

      {current > 0.001 && points.length >= 2 && (() => {
        const midX = (points[0].x + points[1].x) / 2;
        const midY = (points[0].y + points[1].y) / 2;
        const angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
        const sz = 6;
        return (
          <polygon
            points={`${midX},${midY} ${midX - sz * Math.cos(angle - Math.PI / 6)},${midY - sz * Math.sin(angle - Math.PI / 6)} ${midX - sz * Math.cos(angle + Math.PI / 6)},${midY - sz * Math.sin(angle + Math.PI / 6)}`}
            fill={cable.visualColor || defaultColor} opacity={0.8} />
        );
      })()}
      {cableState && current > 0.001 && (
        <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 10}
          textAnchor="middle" fontSize={7} fill="var(--ev-text-secondary)">
          {cable.cable.crossSection}mm² · {current.toFixed(2)}A
          {cableState.voltageDrop > 0.01 && ` · ΔV${cableState.voltageDrop.toFixed(1)}V`}
        </text>
      )}
    </g>
  );
}

function projectPointToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number }
): { point: { x: number; y: number }; distance: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projected = { x: start.x + ratio * dx, y: start.y + ratio * dy };
  return { point: projected, distance: Math.hypot(point.x - projected.x, point.y - projected.y) };
}
