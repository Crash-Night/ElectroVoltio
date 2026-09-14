// ============================================================================
// ElectroVoltio - Protection Evaluation
// Evaluates protection devices based on actual electrical measurements
// ============================================================================

import {
  CircuitModel,
  CircuitComponent,
  ProtectionModel,
  MechanicalState,
  ProtectionEvent,
  ProtectionResult,
  SimulationConfig,
} from "./types";
import { ElectricalGraph, GraphEdge } from "./topology";
import { Complex } from "./solver";
import { getComponentModel } from "@/data/catalog";

export interface ProtectionEvaluation {
  componentId: string;
  mechanicalState: MechanicalState;
  events: ProtectionEvent[];
  protectionResult: ProtectionResult;
}

// --- Evaluate all protection devices ---------------------------------------

export function evaluateProtections(
  circuit: CircuitModel,
  graph: ElectricalGraph,
  nodeVoltages: Map<string, Complex>,
  branchCurrents: Map<string, Complex>,
  config: SimulationConfig,
  previousStates: Map<string, MechanicalState>,
  elapsed: number
): ProtectionEvaluation[] {
  const evaluations: ProtectionEvaluation[] = [];

  for (const comp of circuit.components) {
    const model = getComponentModel(comp.typeId);
    if (!model?.protection) continue;

    const protection = model.protection;
    const events: ProtectionEvent[] = [];

    // Measure current through the protection device
    const measuredCurrent = measureComponentCurrent(graph, branchCurrents, comp.id);

    // Measure voltage at the device
    const measuredVoltage = measureComponentVoltage(graph, nodeVoltages, comp.id, model.terminals);

    // Get current mechanical state
    const previousState = previousStates.get(comp.id) || comp.mechanicalState;

    // Evaluate based on protection type
    let newState = previousState;
    let tripReason = "";
    let tripTime: number | null = null;

    // Sources don't have protection behavior
    if (model.category === "source") {
      evaluations.push({
        componentId: comp.id,
        mechanicalState: previousState,
        events: [],
        protectionResult: {
          componentId: comp.id,
          protectionType: protection.protectionType,
          state: previousState,
          measuredCurrent,
          ratedCurrent: protection.ratedCurrent || 0,
          tripTime: null,
          tripped: false,
        },
      });
      continue;
    }

    switch (protection.protectionType) {
      case "MCB":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateMCB(
          protection, measuredCurrent, measuredVoltage, previousState, elapsed, config
        ));
        break;
      case "RCD":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateRCD(
          protection, graph, branchCurrents, comp.id, model, previousState, elapsed, config
        ));
        break;
      case "FUSE":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateFuse(
          protection, measuredCurrent, previousState, elapsed, config
        ));
        break;
      case "IGA":
      case "ICP":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateOvercurrent(
          protection, measuredCurrent, previousState, elapsed, config
        ));
        break;
      case "MCCB":
      case "ACB":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateMCCB(
          protection, measuredCurrent, measuredVoltage, previousState, elapsed, config
        ));
        break;
      case "SPD":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateSPD(
          protection, measuredVoltage, previousState
        ));
        break;
      case "RELAY_VOLTAGE":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateVoltageRelay(
          protection, measuredVoltage, previousState
        ));
        break;
      case "SECTIONALIZER":
        // Sectionalizer doesn't trip - it's manually operated
        newState = previousState;
        break;
      case "AFDD":
        ({ state: newState, reason: tripReason, time: tripTime } = evaluateAFDD(
          protection, measuredCurrent, previousState, elapsed, config
        ));
        break;
    }

    // Generate events if state changed
    if (newState !== previousState) {
      const event = createProtectionEvent(comp.id, protection, newState, tripReason);
      if (event) events.push(event);
    }

    // Update branches if state changed
    if (newState !== previousState) {
      updateComponentBranches(graph, comp.id, newState === "CLOSED" || newState === "WELDED");
    }

    evaluations.push({
      componentId: comp.id,
      mechanicalState: newState,
      events,
      protectionResult: {
        componentId: comp.id,
        protectionType: protection.protectionType,
        state: newState,
        measuredCurrent,
        ratedCurrent: protection.ratedCurrent || 0,
        tripTime,
        tripped: newState === "TRIPPED" || newState === "BLOWN",
        tripReason: tripReason || undefined,
      },
    });
  }

  return evaluations;
}

// --- MCB Evaluation --------------------------------------------------------

function evaluateMCB(
  protection: ProtectionModel,
  current: number,
  voltage: number,
  previousState: MechanicalState,
  elapsed: number,
  config: SimulationConfig
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "TRIPPED" || previousState === "BLOWN" || previousState === "FAILED") {
    return { state: previousState, reason: "already tripped", time: null };
  }
  if (previousState === "WELDED") {
    return { state: "WELDED", reason: "welded contacts", time: null };
  }

  const In = protection.ratedCurrent || 0;
  if (In <= 0) return { state: previousState, reason: "", time: null };

  const ratio = current / In;

  // Check breaking capacity (Icc should not exceed it)
  const breakingCapacity = (protection.breakingCapacity || 10) * 1000;
  if (current > breakingCapacity) {
    return { state: "WELDED", reason: "exceeded breaking capacity", time: 0 };
  }

  // Thermal trip: sustained overload
  if (protection.curveData) {
    const tripTime = getTimeFromCurve(protection.curveData, ratio);
    if (tripTime !== null && tripTime <= elapsed) {
      return {
        state: "TRIPPED",
        reason: ratio >= 10 ? "magnetic trip" : "thermal trip",
        time: tripTime,
      };
    }
  } else {
    // Fallback: simple thermal/magnetic
    const thermalTrip = protection.thermalTrip || 1.45;
    const magneticTrip = protection.magneticTrip || 10;

    if (ratio >= magneticTrip) {
      return { state: "TRIPPED", reason: "magnetic trip", time: 0.01 };
    }
    if (ratio >= thermalTrip) {
      const tripTime = 3600 / (ratio * ratio); // Simplified I²t
      if (tripTime <= elapsed) {
        return { state: "TRIPPED", reason: "thermal trip", time: tripTime };
      }
    }
  }

  return { state: "CLOSED", reason: "", time: null };
}

// --- RCD Evaluation --------------------------------------------------------

function evaluateRCD(
  protection: ProtectionModel,
  graph: ElectricalGraph,
  branchCurrents: Map<string, Complex>,
  componentId: string,
  model: { terminals: { id: string; phase: string }[] },
  previousState: MechanicalState,
  elapsed: number,
  config: SimulationConfig
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "TRIPPED" || previousState === "BLOWN" || previousState === "FAILED") {
    // Check if it's resettable
    if (protection.rcdBehavior === "RESETTABLE" && previousState === "TRIPPED") {
      // Resettable RCD stays tripped until explicitly reset
      return { state: "TRIPPED", reason: "tripped, awaiting reset", time: null };
    }
    return { state: previousState, reason: "already tripped", time: null };
  }

  const sensitivity = (protection.sensitivity || 30) / 1000; // Convert mA to A

  // Calculate residual current through the toroidal
  // Sum of all currents through the RCD measured conductors
  let residualCurrent = new Complex(0, 0);

  // For a 2P RCD: IL - IN (measured through L and N)
  // For a 4P RCD: IL1 + IL2 + IL3 + IN
  const phaseTerminals = model.terminals.filter((t: { id: string; phase: string }) =>
    t.phase === "L1" || t.phase === "L2" || t.phase === "L3"
  );
  const neutralTerminal = model.terminals.find((t: { id: string; phase: string }) => t.phase === "N");

  // Get branch currents for each conductor
  for (const edge of graph.edges) {
    if (edge.componentId !== componentId || !edge.enabled) continue;

    const current = branchCurrents.get(edge.id) || new Complex(0, 0);

    // Find which terminal this branch corresponds to
    const fromParts = edge.from.split(":");
    const terminalId = fromParts[1];

    const isPhase = phaseTerminals.some((t: { id: string }) => t.id === terminalId);
    const isNeutral = neutralTerminal && terminalId === neutralTerminal.id;

    if (isPhase) {
      // Phase current contributes positively
      residualCurrent = residualCurrent.add(current);
    } else if (isNeutral) {
      // Neutral current contributes negatively (return path)
      residualCurrent = residualCurrent.sub(current);
    }
  }

  const residualMagnitude = residualCurrent.magnitude();

  // S-type RCD has a delay
  if (protection.rcdBehavior === "S") {
    const sDelay = 0.05; // 50ms typical for S-type
    if (residualMagnitude >= sensitivity && elapsed >= sDelay) {
      return { state: "TRIPPED", reason: "residual current detected (S-type delay)", time: sDelay };
    }
    if (residualMagnitude >= sensitivity * 0.5) {
      return { state: previousState, reason: "", time: null };
    }
  } else {
    // Standard RCD: trip if residual exceeds sensitivity
    const tripThreshold = sensitivity * 0.5; // 50% of sensitivity for guaranteed trip
    if (residualMagnitude >= tripThreshold) {
      const tripTime = residualMagnitude >= sensitivity ? 0.03 : 0.1; // 30ms or 100ms
      if (elapsed >= tripTime) {
        return {
          state: "TRIPPED",
          reason: `residual current ${(residualMagnitude * 1000).toFixed(0)}mA > ${protection.sensitivity}mA`,
          time: tripTime,
        };
      }
    }
  }

  return { state: "CLOSED", reason: "", time: null };
}

// --- Fuse Evaluation -------------------------------------------------------

function evaluateFuse(
  protection: ProtectionModel,
  current: number,
  previousState: MechanicalState,
  elapsed: number,
  config: SimulationConfig
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "BLOWN" || previousState === "FAILED") {
    return { state: "BLOWN", reason: "already blown", time: null };
  }

  const In = protection.ratedCurrent || 0;
  if (In <= 0) return { state: previousState, reason: "", time: null };

  const ratio = current / In;
  const i2tRating = protection.i2tRating || (In * In * 10);

  // Calculate I²t accumulation
  const i2t = current * current * elapsed;

  // Different fuse types have different characteristics
  switch (protection.fuseType) {
    case "gG":
      // General purpose fuse
      if (ratio >= 10) {
        return { state: "BLOWN", reason: "high overcurrent", time: 0.01 };
      }
      if (i2t >= i2tRating) {
        return { state: "BLOWN", reason: `I²t exceeded: ${i2t.toFixed(0)} > ${i2tRating.toFixed(0)}`, time: elapsed };
      }
      if (ratio >= 1.6 && elapsed >= 3600) {
        return { state: "BLOWN", reason: "sustained overload", time: 3600 };
      }
      break;
    case "aM":
      // Motor fuse (short-circuit only)
      if (ratio >= 5) {
        return { state: "BLOWN", reason: "short circuit protection", time: 0.01 };
      }
      break;
    case "gPV":
      // Photovoltaic fuse
      if (ratio >= 8) {
        return { state: "BLOWN", reason: "PV overcurrent", time: 0.01 };
      }
      if (i2t >= i2tRating) {
        return { state: "BLOWN", reason: `I²t exceeded`, time: elapsed };
      }
      break;
  }

  return { state: "CLOSED", reason: "", time: null };
}

// --- Overcurrent (IGA/ICP) -------------------------------------------------

function evaluateOvercurrent(
  protection: ProtectionModel,
  current: number,
  previousState: MechanicalState,
  elapsed: number,
  config: SimulationConfig
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "TRIPPED" || previousState === "BLOWN") {
    return { state: previousState, reason: "already tripped", time: null };
  }

  const In = protection.ratedCurrent || 0;
  if (In <= 0) return { state: previousState, reason: "", time: null };

  const ratio = current / In;

  // ICP/IGA trip at their rated current with some tolerance
  if (ratio >= 1.0) {
    // Simplified: trip time inversely proportional to overcurrent
    const tripTime = Math.min(3600 / (ratio * ratio), 60);
    if (elapsed >= tripTime) {
      return {
        state: "TRIPPED",
        reason: `overcurrent ${(current).toFixed(1)}A > ${In}A`,
        time: tripTime,
      };
    }
  }

  return { state: "CLOSED", reason: "", time: null };
}

// --- MCCB/ACB Evaluation ---------------------------------------------------

function evaluateMCCB(
  protection: ProtectionModel,
  current: number,
  voltage: number,
  previousState: MechanicalState,
  elapsed: number,
  config: SimulationConfig
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "TRIPPED" || previousState === "BLOWN" || previousState === "FAILED") {
    return { state: previousState, reason: "already tripped", time: null };
  }

  const In = protection.ratedCurrent || 0;
  if (In <= 0) return { state: previousState, reason: "", time: null };

  const ratio = current / In;

  // Ground fault detection (for ACB)
  if (protection.groundFaultTrip && protection.groundFaultTrip > 0) {
    if (current > protection.groundFaultTrip && elapsed >= 0.1) {
      return { state: "TRIPPED", reason: "ground fault", time: 0.1 };
    }
  }

  // Use curve data if available
  if (protection.curveData) {
    const tripTime = getTimeFromCurve(protection.curveData, ratio);
    if (tripTime !== null && tripTime <= elapsed) {
      return {
        state: "TRIPPED",
        reason: ratio >= 10 ? "instantaneous trip" : "overload trip",
        time: tripTime,
      };
    }
  } else {
    const thermalTrip = protection.thermalTrip || 1.3;
    const magneticTrip = protection.magneticTrip || 10;

    if (ratio >= magneticTrip) {
      return { state: "TRIPPED", reason: "instantaneous trip", time: 0.01 };
    }
    if (ratio >= thermalTrip) {
      const tripTime = 3600 / (ratio * ratio);
      if (tripTime <= elapsed) {
        return { state: "TRIPPED", reason: "thermal trip", time: tripTime };
      }
    }
  }

  return { state: "CLOSED", reason: "", time: null };
}

// --- SPD Evaluation --------------------------------------------------------

function evaluateSPD(
  protection: ProtectionModel,
  voltage: number,
  previousState: MechanicalState
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "FAILED") {
    return { state: "FAILED", reason: "SPD damaged", time: null };
  }

  const uc = protection.uc || 275;
  const up = protection.up || 1.3;

  // SPD activates (lowers impedance) when voltage exceeds its protection level
  if (voltage > uc * up) {
    return { state: "CLOSED", reason: "SPD activated - clamping overvoltage", time: 0 };
  }

  return { state: previousState, reason: "", time: null };
}

// --- Voltage Relay ---------------------------------------------------------

function evaluateVoltageRelay(
  protection: ProtectionModel,
  voltage: number,
  previousState: MechanicalState
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "TRIPPED") {
    return { state: "TRIPPED", reason: "tripped", time: null };
  }

  const vMin = protection.undervoltageSetpoint || 195;
  const vMax = protection.overvoltageSetpoint || 253;

  if (voltage > vMax) {
    return { state: "TRIPPED", reason: `overvoltage: ${voltage.toFixed(0)}V > ${vMax}V`, time: 0.1 };
  }
  if (voltage < vMin) {
    return { state: "TRIPPED", reason: `undervoltage: ${voltage.toFixed(0)}V < ${vMin}V`, time: 0.1 };
  }

  return { state: "CLOSED", reason: "", time: null };
}

// --- AFDD Evaluation -------------------------------------------------------

function evaluateAFDD(
  protection: ProtectionModel,
  current: number,
  previousState: MechanicalState,
  elapsed: number,
  config: SimulationConfig
): { state: MechanicalState; reason: string; time: number | null } {
  if (previousState === "TRIPPED") {
    return { state: "TRIPPED", reason: "tripped", time: null };
  }

  // AFDD detects arc fault patterns (simplified model)
  // In reality, this would analyze current waveform for high-frequency signatures
  // Here we use a simplified model based on current fluctuations

  const In = protection.ratedCurrent || 16;
  const ratio = current / In;

  // AFDD should NOT trip for:
  // - Normal overload (that's MCB's job)
  // - Short circuit (that's MCB's job)
  // - Earth fault (that's RCD's job)
  // It only trips for arc fault signatures

  // Simplified: AFDD doesn't trip in steady-state simulation
  // In a real implementation, it would analyze the frequency content of the current

  return { state: "CLOSED", reason: "", time: null };
}

// --- Helpers ----------------------------------------------------------------

function getTimeFromCurve(
  curveData: { currentMultiple: number; timeSeconds: number }[],
  ratio: number
): number | null {
  // Interpolate on the time-current curve
  // curveData is sorted by currentMultiple ascending

  for (let i = 0; i < curveData.length; i++) {
    const point = curveData[i];
    if (ratio < point.currentMultiple) {
      if (i === 0) return null; // Below minimum trip point

      // Interpolate between curveData[i-1] and curveData[i]
      const prev = curveData[i - 1];
      if (prev.timeSeconds === Infinity) return null;

      // Logarithmic interpolation
      const logRatio = Math.log10(ratio / prev.currentMultiple) /
        Math.log10(point.currentMultiple / prev.currentMultiple);
      const logTime = Math.log10(prev.timeSeconds) +
        logRatio * (Math.log10(point.timeSeconds) - Math.log10(prev.timeSeconds));

      return Math.pow(10, logTime);
    }
  }

  // Above all curve points - use last point's time
  const lastPoint = curveData[curveData.length - 1];
  return lastPoint.timeSeconds === Infinity ? null : lastPoint.timeSeconds;
}

function measureComponentCurrent(
  graph: ElectricalGraph,
  branchCurrents: Map<string, Complex>,
  componentId: string
): number {
  let maxCurrent = 0;
  for (const edge of graph.edges) {
    if (edge.componentId === componentId) {
      const current = branchCurrents.get(edge.id);
      if (current) {
        maxCurrent = Math.max(maxCurrent, current.magnitude());
      }
    }
  }
  return maxCurrent;
}

function measureComponentVoltage(
  graph: ElectricalGraph,
  nodeVoltages: Map<string, Complex>,
  componentId: string,
  terminals: { id: string; phase: string }[]
): number {
  // Get voltage across the component (between phase and neutral/return terminals)
  const phaseTerms = terminals.filter(t => t.phase === "L1" || t.phase === "L2" || t.phase === "L3" || t.phase === "POS");
  const returnTerms = terminals.filter(t => t.phase === "N" || t.phase === "PE" || t.phase === "NEG");

  let maxVoltage = 0;

  for (const pt of phaseTerms) {
    const pNode = nodeVoltages.get(`${componentId}:${pt.id}`);
    if (!pNode) continue;

    for (const rt of returnTerms) {
      const rNode = nodeVoltages.get(`${componentId}:${rt.id}`);
      if (!rNode) continue;

      const vDiff = pNode.sub(rNode).magnitude();
      maxVoltage = Math.max(maxVoltage, vDiff);
    }
  }

  return maxVoltage;
}

function updateComponentBranches(
  graph: ElectricalGraph,
  componentId: string,
  enabled: boolean
): void {
  for (const edge of graph.edges) {
    if (edge.componentId === componentId && edge.source === "internal") {
      edge.enabled = enabled;
    }
  }
}

function createProtectionEvent(
  componentId: string,
  protection: ProtectionModel,
  newState: MechanicalState,
  reason: string
): ProtectionEvent | null {
  const timestamp = Date.now();

  switch (newState) {
    case "TRIPPED":
      if (protection.protectionType === "RCD") {
        return {
          type: "RCD_TRIP",
          severity: "alarm",
          componentId,
          message: `Diferencial ${componentId} disparado: ${reason}`,
          timestamp,
        };
      }
      return {
        type: "MCB_TRIP",
        severity: "alarm",
        componentId,
        message: `Protección ${componentId} disparada: ${reason}`,
        timestamp,
      };
    case "BLOWN":
      return {
        type: "FUSE_BLOWN",
        severity: "alarm",
        componentId,
        message: `Fusible ${componentId} fundido: ${reason}`,
        timestamp,
      };
    case "WELDED":
      return {
        type: "PROT_WELDED",
        severity: "critical",
        componentId,
        message: `Contactos soldados en ${componentId}: ${reason}`,
        timestamp,
      };
    default:
      return null;
  }
}
