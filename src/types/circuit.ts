// ============================================================================
// ElectroVoltio - Frontend Circuit Types
// ============================================================================

export interface ComponentInstance {
  id: string;
  typeId: string;
  x: number;
  y: number;
  rotation: number;
  properties: Record<string, unknown>;
  fault: "NONE" | "OPEN" | "SHORT" | "LEAK" | "ARC" | "OVERVOLTAGE" | "UNDERVOLTAGE" | "RS485_FAULT";
  faultParameters?: Record<string, unknown>;
  mechanicalState: "CLOSED" | "OPEN" | "TRIPPED" | "BLOWN" | "WELDED" | "FAILED";
}

export interface CableInstance {
  id: string;
  fromComponentId: string;
  fromTerminalId: string;
  toComponentId: string;
  toTerminalId: string;
  waypoints: { x: number; y: number }[];
  /** Visual-only override. The electrical engine ignores this property. */
  visualColor?: string;
  cable: CableSpec;
}

export interface CableSpec {
  conductorMaterial: "copper" | "aluminum";
  crossSection: number;
  length: number;
  insulationType: string;
  maxTemperature: number;
  resistivity: number;
  temperatureCoeff: number;
  reactancePerKm: number;
  cores: number;
  installationMethod?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  snapshot?: {
    components: ComponentInstance[];
    cables: CableInstance[];
    metadata: Record<string, unknown>;
  };
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  projectId: string;
  frequency: number;
  tickHz: number;
  ambientTemperature: string;
  snapEnabled: boolean;
}

export interface HistoryEntry {
  components: ComponentInstance[];
  cables: CableInstance[];
  label: string;
}

export type ToolType = "select" | "place" | "wire" | "delete" | "pan" | "fault" | "rotate";

export interface WireDrawing {
  fromComponentId: string;
  fromTerminalId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
