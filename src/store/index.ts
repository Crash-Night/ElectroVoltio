// ============================================================================
// ElectroVoltio - Zustand Store
// No localStorage, no sessionStorage. Pure in-memory with API persistence.
// ============================================================================

"use client";

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import {
  ComponentInstance,
  CableInstance,
  CableSpec,
  ProjectData,
  HistoryEntry,
  ToolType,
  WireDrawing,
} from "@/types/circuit";
import type { SimulationResult } from "@/engine/types";
import type { ElectricalComponentModel } from "@/engine/types";
import { getPresetById } from "@/data/presets";
import { getComponentModel } from "@/data/catalog";

// --- Circuit Store ----------------------------------------------------------

interface CircuitState {
  // Project
  currentProject: ProjectData | null;

  // Circuit data
  components: ComponentInstance[];
  cables: CableInstance[];

  // Selection
  selectedComponentIds: Set<string>;
  selectedCableId: string | null;
  selectedWaypoint: { cableId: string; index: number } | null;

  // Tool
  activeTool: ToolType;
  placingTypeId: string | null;

  // Wire drawing
  wireDrawing: WireDrawing | null;

  // Simulation
  simulationResult: SimulationResult | null;
  isSimulating: boolean;

  // Save state
  isDirty: boolean;
  isSaving: boolean;
  lastSaveError: string | null;
  lastSaveTime: number | null;

  // UI State
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  theme: "light" | "dark";

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Events log
  eventLog: Array<{ id: string; type: string; message: string; severity: string; timestamp: number }>;

  // Actions
  setCurrentProject: (project: ProjectData | null) => void;
  loadProject: (project: ProjectData) => void;
  loadPreset: (presetId: string) => void;
  clearCircuit: () => void;

  // Component actions
  addComponent: (typeId: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  rotateComponent: (id: string) => void;
  updateComponentProperty: (id: string, key: string, value: unknown) => void;
  setComponentFault: (id: string, fault: ComponentInstance["fault"], params?: Record<string, unknown>) => void;
  setMechanicalState: (id: string, state: ComponentInstance["mechanicalState"]) => void;
  toggleProgrammer: (id: string) => void;
  toggleComponentPower: (id: string) => void;
  startTimedProgram: (id: string, durationSec: number) => void;
  stopTimedProgram: (id: string) => void;
  setDimmerLevel: (id: string, level: number) => void;
  setSmokeAlarm: (id: string, active: boolean) => void;
  ringDoorbell: (id: string) => void;

  // Cable actions
  addCable: (cable: Omit<CableInstance, "id" | "cable"> & { cable?: Partial<CableSpec> }) => void;
  removeCable: (id: string) => void;
  updateCableWaypoints: (id: string, waypoints: { x: number; y: number }[]) => void;
  addCableWaypoint: (id: string, point: { x: number; y: number }, index?: number) => void;
  updateCableWaypoint: (id: string, index: number, point: { x: number; y: number }) => void;
  removeCableWaypoint: (id: string, index: number) => void;
  setCableColor: (id: string, color: string | undefined) => void;

  // Selection actions
  selectComponent: (id: string, multi?: boolean) => void;
  selectCable: (id: string | null) => void;
  selectWaypoint: (cableId: string, index: number) => void;
  clearSelection: () => void;

  // Tool actions
  setActiveTool: (tool: ToolType) => void;
  setPlacingType: (typeId: string | null) => void;
  setWireDrawing: (wire: WireDrawing | null) => void;

  // Simulation
  runSimulation: () => Promise<void>;
  setSimulationResult: (result: SimulationResult | null) => void;

  // History
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;

  // Persistence
  saveProject: () => Promise<void>;
  autoSave: () => Promise<void>;

  // UI
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleTheme: () => void;

  // Events
  addEvent: (type: string, message: string, severity?: string) => void;
}

const DEFAULT_CABLE: CableSpec = {
  conductorMaterial: "copper",
  crossSection: 2.5,
  length: 1,
  insulationType: "PVC",
  maxTemperature: 70,
  resistivity: 0.0175,
  temperatureCoeff: 0.00393,
  reactancePerKm: 0.08,
  cores: 2,
};

const MAX_HISTORY = 50;

export const useCircuitStore = create<CircuitState>((set, get) => ({
  // Initial state
  currentProject: null,
  components: [],
  cables: [],
  selectedComponentIds: new Set(),
  selectedCableId: null,
  selectedWaypoint: null,
  activeTool: "select",
  placingTypeId: null,
  wireDrawing: null,
  simulationResult: null,
  isSimulating: false,
  isDirty: false,
  isSaving: false,
  lastSaveError: null,
  lastSaveTime: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: true,
  theme: "light",
  history: [],
  historyIndex: -1,
  eventLog: [],

  // --- Project ---------------------------------------------------------------

  setCurrentProject: (project) => set({ currentProject: project }),

  loadProject: (project) => {
    const snapshot = project.snapshot || { components: [], cables: [], metadata: {} };
    set({
      currentProject: project,
      components: snapshot.components || [],
      cables: snapshot.cables || [],
      selectedComponentIds: new Set(),
      selectedCableId: null,
      selectedWaypoint: null,
      simulationResult: null,
      isDirty: false,
      history: [],
      historyIndex: -1,
      eventLog: [],
    });
  },

  loadPreset: (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    set({
      components: JSON.parse(JSON.stringify(preset.components)),
      cables: JSON.parse(JSON.stringify(preset.cables)),
      selectedComponentIds: new Set(),
      selectedCableId: null,
      selectedWaypoint: null,
      simulationResult: null,
      isDirty: true,
      zoom: 0.95,
      panX: 20,
      panY: 20,
    });

    get().pushHistory(`Cargar plantilla: ${preset.name}`);
    get().addEvent("PRESET_LOADED", `Plantilla cargada: ${preset.name}`, "info");
    get().runSimulation();
  },

  clearCircuit: () => {
    set({
      components: [],
      cables: [],
      selectedComponentIds: new Set(),
      selectedCableId: null,
      selectedWaypoint: null,
      simulationResult: null,
      isDirty: true,
    });
    get().pushHistory("Limpiar circuito");
    get().addEvent("CIRCUIT_CLEARED", "Lienzo despejado", "info");
  },

  // --- Components ------------------------------------------------------------

  addComponent: (typeId, x, y) => {
    let properties: Record<string, unknown> = {};
    let mechanicalState: ComponentInstance["mechanicalState"] = "CLOSED";
    const model = getComponentModel(typeId);
    if (model?.residentialControl) {
      const rc = model.residentialControl;
      const on = rc.defaultOn !== false;
      properties = {
        powered: on,
        programActive: on,
        dimmerLevel: rc.supportsDimmer ? 80 : undefined,
        timerDurationSec: rc.defaultDurationSec || undefined,
        smokeDetected: false,
        ringing: false,
      };
      mechanicalState = on ? "CLOSED" : "OPEN";
    }

    const comp: ComponentInstance = {
      id: uuid(),
      typeId,
      x,
      y,
      rotation: 0,
      properties,
      fault: "NONE",
      mechanicalState,
    };
    const state = get();
    set({
      components: [...state.components, comp],
      isDirty: true,
    });
    state.pushHistory(`Añadir ${typeId}`);
    state.runSimulation();
  },

  removeComponent: (id) => {
    const state = get();
    set({
      components: state.components.filter((c) => c.id !== id),
      cables: state.cables.filter(
        (c) => c.fromComponentId !== id && c.toComponentId !== id
      ),
      selectedComponentIds: new Set(),
      isDirty: true,
    });
    state.pushHistory(`Eliminar componente`);
    state.runSimulation();
  },

  moveComponent: (id, x, y) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, x, y } : c
      ),
      isDirty: true,
    }));
  },

  rotateComponent: (id) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c
      ),
      isDirty: true,
    }));
    get().pushHistory("Rotar componente");
    get().runSimulation();
  },

  updateComponentProperty: (id, key, value) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, properties: { ...c.properties, [key]: value } } : c
      ),
      isDirty: true,
    }));
    get().pushHistory(`Modificar propiedad ${key}`);
    get().runSimulation();
  },

  setComponentFault: (id, fault, params) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, fault, faultParameters: params } : c
      ),
      isDirty: true,
    }));
    get().pushHistory(`Fallo: ${fault}`);
    get().runSimulation();
  },

  setMechanicalState: (id, mechanicalState) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, mechanicalState } : c
      ),
      isDirty: true,
    }));
    get().pushHistory(`Estado: ${mechanicalState}`);
    get().runSimulation();
  },

  toggleProgrammer: (id) => {
    set((state) => ({
      components: state.components.map((c) => {
        if (c.id !== id) return c;
        const current = c.properties?.programActive !== false;
        return {
          ...c,
          properties: { ...c.properties, programActive: !current, powered: !current },
          mechanicalState: !current ? "CLOSED" : "OPEN",
        };
      }),
      isDirty: true,
    }));
    get().pushHistory("Programador horario");
    get().runSimulation();
  },

  toggleComponentPower: (id) => {
    set((state) => ({
      components: state.components.map((c) => {
        if (c.id !== id) return c;
        const currentlyOn = c.properties?.powered !== false && c.mechanicalState !== "OPEN";
        const nextOn = !currentlyOn;
        return {
          ...c,
          mechanicalState: nextOn ? "CLOSED" : "OPEN",
          properties: {
            ...c.properties,
            powered: nextOn,
            programActive: nextOn,
            ringing: nextOn ? c.properties?.ringing : false,
          },
        };
      }),
      isDirty: true,
    }));
    get().pushHistory("Conmutar componente");
    get().runSimulation();
  },

  startTimedProgram: (id, durationSec) => {
    const endsAt = Date.now() + Math.max(1, durationSec) * 1000;
    set((state) => ({
      components: state.components.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          mechanicalState: "CLOSED",
          properties: {
            ...c.properties,
            powered: true,
            programActive: true,
            timerDurationSec: durationSec,
            timerEndsAt: endsAt,
          },
        };
      }),
      isDirty: true,
    }));
    get().pushHistory(`Temporizar ${durationSec}s`);
    get().runSimulation();
    // Auto re-evaluate when timer expires
    setTimeout(() => {
      const current = get().components.find((c) => c.id === id);
      if (!current) return;
      if (typeof current.properties?.timerEndsAt === "number" && Date.now() >= (current.properties.timerEndsAt as number)) {
        get().stopTimedProgram(id);
      }
    }, Math.max(1, durationSec) * 1000 + 30);
  },

  stopTimedProgram: (id) => {
    set((state) => ({
      components: state.components.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          mechanicalState: "OPEN",
          properties: {
            ...c.properties,
            powered: false,
            programActive: false,
            timerEndsAt: undefined,
            ringing: false,
          },
        };
      }),
      isDirty: true,
    }));
    get().pushHistory("Fin de temporización");
    get().runSimulation();
  },

  setDimmerLevel: (id, level) => {
    const dimmerLevel = Math.max(0, Math.min(100, level));
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id
          ? {
              ...c,
              properties: {
                ...c.properties,
                dimmerLevel,
                powered: dimmerLevel > 1,
                programActive: dimmerLevel > 1,
              },
              mechanicalState: dimmerLevel > 1 ? "CLOSED" : "OPEN",
            }
          : c
      ),
      isDirty: true,
    }));
    get().pushHistory(`Dimmer ${dimmerLevel}%`);
    get().runSimulation();
  },

  setSmokeAlarm: (id, active) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id
          ? {
              ...c,
              properties: {
                ...c.properties,
                smokeDetected: active,
                powered: true,
              },
            }
          : c
      ),
      isDirty: true,
    }));
    get().pushHistory(active ? "Simular humo" : "Fin de humo");
    get().addEvent(active ? "SMOKE_DETECTED" : "SMOKE_CLEARED", active ? "Humo detectado" : "Humo despejado", active ? "alarm" : "info");
    get().runSimulation();
  },

  ringDoorbell: (id) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id
          ? {
              ...c,
              mechanicalState: "CLOSED",
              properties: {
                ...c.properties,
                powered: true,
                programActive: true,
                ringing: true,
                timerEndsAt: Date.now() + 3000,
              },
            }
          : c
      ),
      isDirty: true,
    }));
    get().pushHistory("Activar timbre");
    get().addEvent("DOORBELL_RING", "Timbre/intercomunicador activado", "info");
    get().runSimulation();
    setTimeout(() => {
      set((state) => ({
        components: state.components.map((c) =>
          c.id === id
            ? {
                ...c,
                mechanicalState: "OPEN",
                properties: {
                  ...c.properties,
                  ringing: false,
                  powered: false,
                  programActive: false,
                  timerEndsAt: undefined,
                },
              }
            : c
        ),
      }));
      get().runSimulation();
    }, 3000);
  },

  // --- Cables ----------------------------------------------------------------

  addCable: (cableData) => {
    const cable: CableInstance = {
      id: uuid(),
      ...cableData,
      cable: { ...DEFAULT_CABLE, ...cableData.cable },
    };
    const state = get();
    set({
      cables: [...state.cables, cable],
      isDirty: true,
    });
    state.pushHistory("Añadir cable");
    state.runSimulation();
  },

  removeCable: (id) => {
    set((state) => ({
      cables: state.cables.filter((c) => c.id !== id),
      selectedCableId: null,
      selectedWaypoint: null,
      isDirty: true,
    }));
    get().pushHistory("Eliminar cable");
    get().runSimulation();
  },

  updateCableWaypoints: (id, waypoints) => {
    set((state) => ({
      cables: state.cables.map((c) =>
        c.id === id ? { ...c, waypoints } : c
      ),
      isDirty: true,
    }));
  },

  addCableWaypoint: (id, point, index) => {
    const state = get();
    const cable = state.cables.find((item) => item.id === id);
    if (!cable) return;
    const insertionIndex = Math.max(0, Math.min(index ?? cable.waypoints.length, cable.waypoints.length));
    const waypoints = [...cable.waypoints];
    waypoints.splice(insertionIndex, 0, point);
    set((current) => ({
      cables: current.cables.map((item) => item.id === id ? { ...item, waypoints } : item),
      selectedCableId: id,
      selectedWaypoint: { cableId: id, index: insertionIndex },
      selectedComponentIds: new Set(),
      isDirty: true,
    }));
    get().pushHistory("Añadir waypoint");
  },

  updateCableWaypoint: (id, index, point) => {
    set((state) => ({
      cables: state.cables.map((cable) => {
        if (cable.id !== id || !cable.waypoints[index]) return cable;
        const waypoints = [...cable.waypoints];
        waypoints[index] = point;
        return { ...cable, waypoints };
      }),
      isDirty: true,
    }));
  },

  removeCableWaypoint: (id, index) => {
    const state = get();
    const cable = state.cables.find((item) => item.id === id);
    if (!cable || index < 0 || index >= cable.waypoints.length) return;
    const waypoints = cable.waypoints.filter((_, waypointIndex) => waypointIndex !== index);
    set((current) => ({
      cables: current.cables.map((item) => item.id === id ? { ...item, waypoints } : item),
      selectedWaypoint: null,
      selectedCableId: id,
      isDirty: true,
    }));
    get().pushHistory("Eliminar waypoint");
  },

  setCableColor: (id, color) => {
    set((state) => ({
      cables: state.cables.map((cable) => cable.id === id ? { ...cable, visualColor: color } : cable),
      isDirty: true,
    }));
    get().pushHistory(color ? "Cambiar color del cable" : "Restaurar color del cable");
  },

  // --- Selection -------------------------------------------------------------

  selectComponent: (id, multi) => {
    set((state) => {
      const newSet = multi
        ? new Set(state.selectedComponentIds)
        : new Set<string>();
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return {
        selectedComponentIds: newSet,
        selectedCableId: null,
        selectedWaypoint: null,
      };
    });
  },

  selectCable: (id) => {
    set({
      selectedCableId: id,
      selectedWaypoint: null,
      selectedComponentIds: new Set(),
    });
  },

  selectWaypoint: (cableId, index) => {
    set({
      selectedCableId: cableId,
      selectedWaypoint: { cableId, index },
      selectedComponentIds: new Set(),
    });
  },

  clearSelection: () => {
    set({
      selectedComponentIds: new Set(),
      selectedCableId: null,
      selectedWaypoint: null,
    });
  },

  // --- Tools -----------------------------------------------------------------

  setActiveTool: (tool) => set({ activeTool: tool, placingTypeId: null, wireDrawing: null }),
  setPlacingType: (typeId) => set({ placingTypeId: typeId, activeTool: "place" }),
  setWireDrawing: (wire) => set({ wireDrawing: wire }),

  // --- Simulation ------------------------------------------------------------

  runSimulation: async () => {
    const state = get();
    const project = state.currentProject;

    if (state.components.length === 0) {
      set({ simulationResult: null });
      return;
    }

    set({ isSimulating: true });

    try {
      const url = project
        ? `/api/projects/${project.id}/simulate`
        : `/api/simulate`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circuit: {
            components: state.components,
            cables: state.cables,
            metadata: {},
          },
        }),
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Respuesta del servidor no válida (${response.status}): ${text.slice(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data?.message || `Error del servidor (${response.status})`);
      }

      const result: SimulationResult = data;
      set({ simulationResult: result, isSimulating: false });

      // Add simulation events to log
      for (const event of result.events) {
        get().addEvent(event.type, event.message, event.severity);
      }
    } catch (error) {
      console.error("Simulation error:", error);
      set({ isSimulating: false });
      get().addEvent(
        "SIMULATION_ERROR",
        `Error de simulación: ${error instanceof Error ? error.message : "Unknown"}`,
        "critical"
      );
    }
  },

  setSimulationResult: (result) => set({ simulationResult: result }),

  // --- History (Undo/Redo) ---------------------------------------------------

  pushHistory: (label) => {
    const state = get();
    const entry: HistoryEntry = {
      components: JSON.parse(JSON.stringify(state.components)),
      cables: JSON.parse(JSON.stringify(state.cables)),
      label,
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];

    set({
      components: JSON.parse(JSON.stringify(entry.components)),
      cables: JSON.parse(JSON.stringify(entry.cables)),
      historyIndex: newIndex,
      isDirty: true,
    });
    get().runSimulation();
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];

    set({
      components: JSON.parse(JSON.stringify(entry.components)),
      cables: JSON.parse(JSON.stringify(entry.cables)),
      historyIndex: newIndex,
      isDirty: true,
    });
    get().runSimulation();
  },

  // --- Persistence (API) -----------------------------------------------------

  saveProject: async () => {
    const state = get();
    const project = state.currentProject;
    if (!project) return;

    set({ isSaving: true, lastSaveError: null });

    try {
      const response = await fetch(`/api/projects/${project.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: {
            components: state.components,
            cables: state.cables,
            metadata: {},
          },
          expectedVersion: project.version,
        }),
      });

      if (response.status === 409) {
        const error = await response.json();
        set({
          isSaving: false,
          lastSaveError: error.message,
        });
        get().addEvent("VERSION_CONFLICT", error.message, "warning");
        return;
      }

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const result = await response.json();

      set({
        isSaving: false,
        isDirty: false,
        lastSaveTime: Date.now(),
        lastSaveError: null,
        currentProject: {
          ...project,
          version: result.project.version,
          updatedAt: result.project.updatedAt,
        },
      });
    } catch (error) {
      set({
        isSaving: false,
        lastSaveError: error instanceof Error ? error.message : "Error al guardar",
      });
      get().addEvent(
        "SAVE_ERROR",
        `Error al guardar: ${error instanceof Error ? error.message : "Unknown"}`,
        "critical"
      );
    }
  },

  autoSave: async () => {
    const state = get();
    if (!state.isDirty || !state.currentProject || state.isSaving) return;
    await get().saveProject();
  },

  // --- UI --------------------------------------------------------------------

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(8, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

  // --- Events ----------------------------------------------------------------

  addEvent: (type, message, severity = "info") => {
    set((state) => ({
      eventLog: [
        { id: uuid(), type, message, severity, timestamp: Date.now() },
        ...state.eventLog,
      ].slice(0, 200), // Keep last 200 events
    }));
  },
}));

// --- Auto-save debounce timer -----------------------------------------------

let autoSaveTimer: NodeJS.Timeout | null = null;

export function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    useCircuitStore.getState().autoSave();
  }, 600);
}
