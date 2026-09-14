// ============================================================================
// ElectroVoltio - Electrical Simulation Engine Types
// Pure TypeScript, no DOM dependencies
// ============================================================================

// --- Phases & Conductors ---------------------------------------------------
export type Phase = "L1" | "L2" | "L3" | "N" | "PE" | "POS" | "NEG";
export type ConductorRole = "phase" | "neutral" | "protective" | "positive" | "negative";

// --- Device States ---------------------------------------------------------
export type MechanicalState = "CLOSED" | "OPEN" | "TRIPPED" | "BLOWN" | "WELDED" | "FAILED";
export type ElectricalState = "ENERGIZED" | "DEENERGIZED" | "OVERLOAD" | "SHORT_CIRCUIT" | "EARTH_FAULT" | "OVERVOLTAGE" | "UNDERVOLTAGE" | "PHASE_LOSS";
export type ThermalState = "NORMAL" | "WARM" | "HOT" | "OVERHEATED";

// --- Component Categories --------------------------------------------------
export type ComponentCategory =
  | "source" | "distribution" | "protection" | "load"
  | "passive" | "instrument" | "photovoltaic" | "ev_charging"
  | "industrial" | "residential" | "semiconductor";

// --- Protection Types ------------------------------------------------------
export type ProtectionType = "MCB" | "RCD" | "IGA" | "ICP" | "MCCB" | "ACB" | "FUSE" | "SPD" | "AFDD" | "RELAY_VOLTAGE" | "RELAY_PHASE" | "SECTIONALIZER";
export type RCDBehavior = "AC" | "A" | "F" | "B" | "S" | "SUPERIMMUNE" | "RESETTABLE";
export type MCBCurve = "B" | "C" | "D" | "K" | "Z";
export type FuseType = "gG" | "aM" | "gPV";

// --- Fault Types -----------------------------------------------------------
export type FaultType = "NONE" | "OPEN" | "SHORT" | "LEAK" | "ARC" | "OVERVOLTAGE" | "UNDERVOLTAGE" | "RS485_FAULT";

// --- Terminal Definition ---------------------------------------------------
export interface TerminalDefinition {
  id: string;
  name: string;
  phase: Phase;
  role: ConductorRole;
  direction: "in" | "out" | "bidirectional";
  group?: string; // e.g. "input", "output" for transformers
}

// --- Branch Definition (internal to a component) ---------------------------
export interface BranchDefinition {
  id: string;
  fromTerminal: string;
  toTerminal: string;
  resistance: number; // Ohms
  reactance: number;  // Ohms
  enabled: boolean;
  phase: Phase;
}

// --- Load Model ------------------------------------------------------------
export interface LoadModel {
  type: "resistive" | "inductive" | "capacitive" | "impedance" | "constant_power" | "motor";
  resistance?: number;   // Ohms
  inductance?: number;   // Henry
  capacitance?: number;  // Farads
  impedance?: { r: number; x: number };
  ratedPower?: number;   // Watts
  ratedVoltage?: number; // Volts
  powerFactor?: number;
  efficiency?: number;
  phases: Phase[];       // Which phases the load connects to
  needsNeutral: boolean;
}

// --- Source Model ----------------------------------------------------------
export interface SourceModel {
  sourceType: "ac_single" | "ac_three_phase" | "dc";
  voltage: number;       // Line-to-neutral or DC voltage
  frequency: number;     // Hz (0 for DC)
  internalImpedance: { r: number; x: number };
  phases: Phase[];
  // For 3-phase
  phaseAngles?: number[]; // radians, e.g. [0, -2π/3, -4π/3]
}

// --- Protection Model ------------------------------------------------------
export interface ProtectionModel {
  protectionType: ProtectionType;
  ratedCurrent?: number;         // In (A)
  curve?: MCBCurve;
  curveData?: CurveDataPoint[];  // Time-current characteristic
  sensitivity?: number;          // mA for RCD
  rcdBehavior?: RCDBehavior;
  breakingCapacity?: number;     // kA
  poles?: number;
  thermalTrip?: number;          // Multiple of In for thermal
  magneticTrip?: number;         // Multiple of In for magnetic
  groundFaultTrip?: number;      // A for ground fault
  fuseType?: FuseType;
  i2tRating?: number;           // A²s for fuses
  voltageMin?: number;
  voltageMax?: number;
  // SPD parameters
  uc?: number;   // Maximum continuous voltage
  up?: number;   // Voltage protection level
  inSPD?: number; // Nominal discharge current
  imax?: number; // Maximum discharge current
  // Relay parameters
  overvoltageSetpoint?: number;
  undervoltageSetpoint?: number;
  phaseLossDetection?: boolean;
  phaseSequenceDetection?: boolean;
  unbalanceDetection?: number; // percentage
  // AFDD parameters
  arcSensitivity?: "low" | "medium" | "high";
}

// --- Residential Control Model ---------------------------------------------
export type ResidentialControlKind =
  | "switch"
  | "pushbutton"
  | "dimmer"
  | "timer"
  | "sensor"
  | "relay"
  | "shutter"
  | "smart"
  | "socket"
  | "signal"
  | "load";

export interface ResidentialControlModel {
  kind: ResidentialControlKind;
  poles?: number;
  defaultOn?: boolean;
  isMomentary?: boolean;
  isNormallyClosed?: boolean;
  hasIndicator?: boolean;
  isTimed?: boolean;
  defaultDurationSec?: number;
  supportsDimmer?: boolean;
  supportsSmoke?: boolean;
  supportsBell?: boolean;
  supportsMotor?: boolean;
  canToggle?: boolean;
}

export interface CurveDataPoint {
  currentMultiple: number; // I/In
  timeSeconds: number;
}

// --- Transformer Model -----------------------------------------------------
export interface TransformerModel {
  turnsRatio: number;          // V2/V1
  impedance: { r: number; x: number }; // Referred to primary
  ratedPower: number;          // VA
  primaryPhases: Phase[];
  secondaryPhases: Phase[];
}

// --- SPD Model -------------------------------------------------------------
export interface SPDModel {
  mode: "L-PE" | "L-N" | "N-PE" | "L-L";
  uc: number;
  up: number;
  in: number;
  imax: number;
  surgeCount: number;
  degraded: boolean;
}

// --- Electrical Component Model --------------------------------------------
export interface ElectricalComponentModel {
  typeId: string;
  name: string;
  category: ComponentCategory;
  terminals: TerminalDefinition[];
  branches: BranchDefinition[];
  /** Spatial terminal layout. "residential" spreads L/N/PE across distinct edges (like a distribution board). */
  terminalLayout?: "residential" | "default";
  source?: SourceModel;
  load?: LoadModel;
  protection?: ProtectionModel;
  transformer?: TransformerModel;
  spd?: SPDModel;
  residentialControl?: ResidentialControlModel;
  thermalResistance?: number; // K/W
  maxTemperature?: number;    // °C
  ratedCurrent?: number;
  ratedVoltage?: number;
  normativeReferences?: string[];
  flags?: string[];
}

// --- Cable Model -----------------------------------------------------------
export interface CableModel {
  conductorMaterial: "copper" | "aluminum";
  crossSection: number;     // mm²
  length: number;           // meters
  insulationType: string;   // PVC, XLPE, etc.
  maxTemperature: number;   // °C
  resistivity: number;      // Ω·mm²/m (at 20°C)
  temperatureCoeff: number; // 1/°C
  reactancePerKm: number;   // Ω/km
  cores: number;
  installationMethod?: string;
}

// --- Circuit (Input to Engine) --------------------------------------------
export interface CircuitComponent {
  id: string;
  typeId: string;
  x: number;
  y: number;
  rotation: number;
  properties: Record<string, unknown>;
  fault: FaultType;
  faultParameters?: Record<string, unknown>;
  mechanicalState: MechanicalState;
}

export interface CableConnection {
  id: string;
  fromComponentId: string;
  fromTerminalId: string;
  toComponentId: string;
  toTerminalId: string;
  waypoints: { x: number; y: number }[];
  /** Presentation-only override; ignored by topology and solver. */
  visualColor?: string;
  cable: CableModel;
}

export interface CircuitModel {
  components: CircuitComponent[];
  cables: CableConnection[];
  metadata: Record<string, unknown>;
}

export interface SimulationConfig {
  frequency: number;         // Hz
  ambientTemperature: number; // °C
  tickHz: number;
  substeps: number;
  maxIterations: number;
  tolerance: number;
  convergenceMethod: "gauss_seidel" | "newton_raphson";
}

// --- Engine Output ---------------------------------------------------------

export interface NodeElectricalState {
  nodeId: string;
  voltage: number;      // V (magnitude)
  voltageAngle: number; // radians
  phase: Phase;
  referencedTo?: string;
}

export interface BranchElectricalState {
  branchId: string;
  fromNode: string;
  toNode: string;
  current: number;      // A (magnitude)
  currentAngle: number; // radians
  power: number;        // W
  reactivePower: number; // VAR
  voltageDrop: number;  // V
  componentId?: string;
  cableId?: string;
}

export interface ComponentState {
  id: string;
  typeId: string;
  mechanical: MechanicalState;
  electrical: ElectricalState;
  thermal: ThermalState;
  temperature: number;  // °C
  terminalVoltages: Record<string, number>;
  terminalCurrents: Record<string, number>;
  totalCurrent: number;
  totalPower: number;
  totalReactivePower: number;
  powerFactor: number;
  voltageDrop: number;
  // Protection-specific
  protectionTripped?: boolean;
  tripReason?: string;
  tripTime?: number;
  thermalAccumulator?: number;
  rcdResidualCurrent?: number;
  fuseBlown?: boolean;
  // Transformer
  primaryVoltage?: number;
  secondaryVoltage?: number;
}

export interface CableState {
  id: string;
  current: number;
  voltageDrop: number;
  powerLoss: number;
  temperature: number;
  loading: number;       // percentage of rated
  isOverloaded: boolean;
  isOverheated: boolean;
}

export interface ProtectionEvent {
  type: "MCB_TRIP" | "RCD_TRIP" | "FUSE_BLOWN" | "PROT_WELDED" | "SHORT_CIRCUIT" | "EARTH_FAULT" | "OVERVOLTAGE" | "UNDERVOLTAGE" | "PHASE_LOSS" | "PHASE_UNBALANCE" | "CABLE_OVERLOAD" | "CABLE_OVERHEAT" | "SOLVER_NOT_CONVERGED" | "INVALID_CONNECTION" | "OVERCURRENT" | "ARC_FAULT" | "SPD_ACTIVATED";
  severity: "info" | "warning" | "alarm" | "critical";
  componentId?: string;
  cableId?: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface NormativeViolation {
  ruleId: string;
  severity: "info" | "warning" | "violation";
  componentId?: string;
  cableId?: string;
  message: string;
  reference?: string;
}

export interface TopologyResult {
  nodes: string[];
  edges: string[];
  connectedComponents: number;
  isComplete: boolean; // All loads have return path
  islands: string[][];
}

export interface SimulationResult {
  converged: boolean;
  iterations: number;
  residual: number;
  stable: boolean;
  topology: TopologyResult;
  nodes: NodeElectricalState[];
  branches: BranchElectricalState[];
  componentStates: Record<string, ComponentState>;
  cableStates: Record<string, CableState>;
  faults: FaultResult[];
  protections: ProtectionResult[];
  events: ProtectionEvent[];
  violations: NormativeViolation[];
  summary: {
    totalActivePower: number;
    totalReactivePower: number;
    totalApparentPower: number;
    sourceCurrent: number;
    maxTemperature: number;
    energizedLoads: number;
    activeFaults: number;
    trippedProtections: number;
  };
}

export interface FaultResult {
  faultType: FaultType;
  componentId: string;
  location: string;
  current: number;
  impedance: number;
  active: boolean;
}

export interface ProtectionResult {
  componentId: string;
  protectionType: ProtectionType;
  state: MechanicalState;
  measuredCurrent: number;
  ratedCurrent: number;
  tripTime: number | null;
  tripped: boolean;
  tripReason?: string;
}
