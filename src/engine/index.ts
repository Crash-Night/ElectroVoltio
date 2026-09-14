// ============================================================================
// ElectroVoltio - Main Simulation Engine
// Deterministic electrical simulation pipeline
// No DOM dependencies - can run on server or client
// ============================================================================

import {
  CircuitModel,
  CircuitComponent,
  SimulationConfig,
  SimulationResult,
  ComponentState,
  CableState,
  MechanicalState,
  ElectricalState,
  ThermalState,
  ProtectionEvent,
  FaultResult,
  NormativeViolation,
  CableConnection,
} from "./types";
import { buildTopology, ElectricalGraph, GraphEdge } from "./topology";
import { solveCircuit, Complex, SolverResult } from "./solver";
import { evaluateProtections, ProtectionEvaluation } from "./protections";
import { validateCircuit } from "./validation";
import { getComponentModel } from "@/data/catalog";

// --- Default simulation config ----------------------------------------------

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  frequency: 50,
  ambientTemperature: 20,
  tickHz: 10,
  substeps: 10,
  maxIterations: 50,
  tolerance: 1e-6,
  convergenceMethod: "gauss_seidel",
};

// --- Previous simulation state (for thermal accumulation, etc.) -------------

export interface PreviousSimulationState {
  mechanicalStates: Map<string, MechanicalState>;
  thermalAccumulators: Map<string, number>;
  protectionTripTimes: Map<string, number>;
  elapsed: number;
}

export const DEFAULT_PREVIOUS_STATE: PreviousSimulationState = {
  mechanicalStates: new Map(),
  thermalAccumulators: new Map(),
  protectionTripTimes: new Map(),
  elapsed: 0,
};

// --- Main simulation function -----------------------------------------------

export function simulate(
  circuit: CircuitModel,
  previousState: PreviousSimulationState = DEFAULT_PREVIOUS_STATE,
  config: SimulationConfig = DEFAULT_SIM_CONFIG
): SimulationResult {
  const events: ProtectionEvent[] = [];
  const startTime = Date.now();

  // 1. Build topology
  const { graph, topology, errors: topoErrors } = buildTopology(circuit, previousState.mechanicalStates);

  // Report topology errors as events
  for (const err of topoErrors) {
    events.push({
      type: "INVALID_CONNECTION",
      severity: "warning",
      message: err,
      timestamp: startTime,
    });
  }

  // 2. Solve electrical circuit
  const solverResult = solveCircuit(graph, circuit, config);

  if (!solverResult.converged) {
    events.push({
      type: "SOLVER_NOT_CONVERGED",
      severity: "critical",
      message: `Solver no convergió. Residual: ${solverResult.residual.toExponential(2)}`,
      timestamp: startTime,
    });
  }

  // 3. Evaluate protections
  const substepDt = 1 / config.tickHz / config.substeps;
  const protectionEvals = evaluateProtections(
    circuit, graph, solverResult.nodeVoltages, solverResult.branchCurrents,
    config, previousState.mechanicalStates, previousState.elapsed + substepDt
  );

  // Collect protection events
  for (const eval_ of protectionEvals) {
    events.push(...eval_.events);
    // Update mechanical state
    previousState.mechanicalStates.set(eval_.componentId, eval_.mechanicalState);
  }

  // 4. Re-solve if protection states changed
  let finalSolverResult = solverResult;
  const statesChanged = protectionEvals.some(e =>
    e.mechanicalState !== (previousState.mechanicalStates.get(e.componentId) || "CLOSED")
  );

  if (statesChanged) {
    // Rebuild topology with new mechanical states
    const { graph: newGraph, topology: newTopology } = buildTopology(circuit, previousState.mechanicalStates);
    finalSolverResult = solveCircuit(newGraph, circuit, config);
  }

  // 5. Calculate component states
  const componentStates = buildComponentStates(
    circuit, graph, finalSolverResult, protectionEvals, previousState, config
  );

  // 6. Calculate cable states
  const cableStates = buildCableStates(circuit, graph, finalSolverResult, config);

  // 7. Detect faults
  const faults = detectFaults(circuit, componentStates, finalSolverResult);

  // 8. Build protection results
  const protectionResults = protectionEvals.map(p => p.protectionResult);

  // 9. Validate circuit
  const tempResult: SimulationResult = {
    converged: finalSolverResult.converged,
    iterations: finalSolverResult.iterations,
    residual: finalSolverResult.residual,
    stable: finalSolverResult.converged,
    topology,
    nodes: finalSolverResult.nodeStates,
    branches: finalSolverResult.branchStates,
    componentStates,
    cableStates,
    faults,
    protections: protectionResults,
    events,
    violations: [],
    summary: {
      totalActivePower: 0,
      totalReactivePower: 0,
      totalApparentPower: 0,
      sourceCurrent: 0,
      maxTemperature: config.ambientTemperature,
      energizedLoads: 0,
      activeFaults: faults.filter(f => f.active).length,
      trippedProtections: protectionResults.filter(p => p.tripped).length,
    },
  };

  const violations = validateCircuit(circuit, graph, tempResult);
  tempResult.violations = violations;

  // 10. Calculate summary
  calculateSummary(tempResult, circuit, config);

  return tempResult;
}

// --- Build component states ------------------------------------------------

function buildComponentStates(
  circuit: CircuitModel,
  graph: ElectricalGraph,
  solverResult: SolverResult,
  protectionEvals: ProtectionEvaluation[],
  previousState: PreviousSimulationState,
  config: SimulationConfig
): Record<string, ComponentState> {
  const states: Record<string, ComponentState> = {};

  for (const comp of circuit.components) {
    const model = getComponentModel(comp.typeId);
    if (!model) continue;

    // Get mechanical state from protection evaluation
    const protEval = protectionEvals.find(p => p.componentId === comp.id);
    const mechanical = protEval?.mechanicalState || comp.mechanicalState;

    // Calculate terminal voltages and currents
    const terminalVoltages: Record<string, number> = {};
    const terminalCurrents: Record<string, number> = {};

    for (const term of model.terminals) {
      const nodeId = `${comp.id}:${term.id}`;
      const nodeVoltage = solverResult.nodeVoltages.get(nodeId);
      terminalVoltages[term.id] = nodeVoltage ? nodeVoltage.magnitude() : 0;

      // Sum currents into this terminal
      let totalCurrent = new Complex(0, 0);
      for (const edge of graph.edges) {
        if (edge.componentId === comp.id) {
          const current = solverResult.branchCurrents.get(edge.id);
          if (current) {
            if (edge.from === nodeId) {
              totalCurrent = totalCurrent.sub(current);
            } else if (edge.to === nodeId) {
              totalCurrent = totalCurrent.add(current);
            }
          }
        }
      }
      terminalCurrents[term.id] = totalCurrent.magnitude();
    }

    // Total current through the component
    let totalCurrent = 0;

    // For source components, use the MNA source current
    const sourceCurrent = solverResult.sourceCurrents.get(comp.id);
    if (sourceCurrent) {
      totalCurrent = sourceCurrent.magnitude();
    } else {
      // For non-source components, sum current through internal branches
      for (const edge of graph.edges) {
        if (edge.componentId === comp.id && edge.source === "internal") {
          const current = solverResult.branchCurrents.get(edge.id);
          if (current) {
            totalCurrent = Math.max(totalCurrent, current.magnitude());
          }
        }
      }
    }

    // Calculate power
    let totalPower = 0;
    let totalReactivePower = 0;
    for (const branchState of solverResult.branchStates) {
      if (branchState.componentId === comp.id) {
        totalPower += Math.abs(branchState.power);
        totalReactivePower += Math.abs(branchState.reactivePower);
      }
    }

    // For instruments with voltage and current coils (Wattmeter, Energy meter, Analyzers),
    // calculate true measured through-power: P = V_ref * I_through
    if (model.category === "instrument") {
      const vL = terminalVoltages["L_in"] ?? terminalVoltages["L"] ?? terminalVoltages["A"] ?? terminalVoltages["L1_in"] ?? terminalVoltages["CH1"] ?? 0;
      const vN = terminalVoltages["N_in"] ?? terminalVoltages["N"] ?? terminalVoltages["B"] ?? terminalVoltages["CH2"] ?? 0;
      const vDiff = Math.abs(vL - vN);
      if (vDiff > 5 && totalCurrent > 0.001) {
        totalPower = vDiff * totalCurrent;
        totalReactivePower = 0;
      }
    }

    // Check user manual powered state override from properties
    const userPowered = comp.properties?.powered !== false;
    let effectiveMechanical = mechanical;
    if (!userPowered) {
      effectiveMechanical = "OPEN";
    }

    // Determine electrical state
    const electrical = determineElectricalState(comp, model, effectiveMechanical, totalCurrent, terminalVoltages, config);

    // Calculate temperature (simplified thermal model)
    const thermalState = calculateThermalState(comp, model, totalCurrent, config, previousState);

    // RCD specific
    let rcdResidualCurrent: number | undefined;
    if (protEval?.protectionResult.protectionType === "RCD") {
      rcdResidualCurrent = totalCurrent; // Simplified
    }

    // Power factor
    const apparentPower = Math.sqrt(totalPower * totalPower + totalReactivePower * totalReactivePower);
    const powerFactor = apparentPower > 0 ? totalPower / apparentPower : 1;

    states[comp.id] = {
      id: comp.id,
      typeId: comp.typeId,
      mechanical,
      electrical,
      thermal: thermalState.state,
      temperature: thermalState.temperature,
      terminalVoltages,
      terminalCurrents,
      totalCurrent,
      totalPower,
      totalReactivePower,
      powerFactor,
      voltageDrop: 0,
      protectionTripped: protEval?.protectionResult.tripped,
      tripReason: protEval?.protectionResult.tripReason,
      tripTime: protEval?.protectionResult.tripTime || undefined,
      rcdResidualCurrent,
    };
  }

  return states;
}

// --- Determine electrical state ---------------------------------------------

function determineElectricalState(
  comp: CircuitComponent,
  model: ReturnType<typeof getComponentModel>,
  mechanical: MechanicalState,
  totalCurrent: number,
  terminalVoltages: Record<string, number>,
  config: SimulationConfig
): ElectricalState {
  if (!model) return "DEENERGIZED";

  // Sources are always energized
  if (model.category === "source") return "ENERGIZED";

  // Check if device is conducting
  if (mechanical === "OPEN" || mechanical === "TRIPPED" || mechanical === "BLOWN" || mechanical === "FAILED") {
    return "DEENERGIZED";
  }

  // Check for faults
  if (comp.fault === "SHORT") return "SHORT_CIRCUIT";
  if (comp.fault === "LEAK") return "EARTH_FAULT";

  // Check voltage (only on phase terminals, not N/PE)
  const phaseTerminals = model.terminals.filter(t =>
    t.role === "phase" || t.role === "positive" || t.role === "negative"
  );
  const returnTerminals = model.terminals.filter(t =>
    t.role === "neutral" || t.role === "protective" || t.role === "negative"
  );

  let maxPhaseVoltage = 0;
  for (const pt of phaseTerminals) {
    const pv = terminalVoltages[pt.id] || 0;
    for (const rt of returnTerminals) {
      if (pt.id === rt.id) continue;
      const rv = terminalVoltages[rt.id] || 0;
      maxPhaseVoltage = Math.max(maxPhaseVoltage, Math.abs(pv - rv));
    }
  }
  // If no phase-return pair found, use direct phase voltage
  if (maxPhaseVoltage === 0 && phaseTerminals.length > 0) {
    maxPhaseVoltage = Math.max(...phaseTerminals.map(t => terminalVoltages[t.id] || 0));
  }

  if (model.ratedVoltage && maxPhaseVoltage > 0) {
    if (maxPhaseVoltage > model.ratedVoltage * 1.1) return "OVERVOLTAGE";
    if (maxPhaseVoltage < model.ratedVoltage * 0.85) return "UNDERVOLTAGE";
  }

  // Check for load with current
  if (model.category === "load" || model.load) {
    if (totalCurrent > 0.001) {
      // Check overload
      if (model.ratedCurrent && totalCurrent > model.ratedCurrent * 1.1) {
        return "OVERLOAD";
      }
      return "ENERGIZED";
    }
    return "DEENERGIZED";
  }

  return totalCurrent > 0.001 ? "ENERGIZED" : "DEENERGIZED";
}

// --- Thermal state calculation ---------------------------------------------

function calculateThermalState(
  comp: CircuitComponent,
  model: ReturnType<typeof getComponentModel>,
  current: number,
  config: SimulationConfig,
  previousState: PreviousSimulationState
): { state: ThermalState; temperature: number } {
  const ambientTemp = config.ambientTemperature;

  if (!model) return { state: "NORMAL", temperature: ambientTemp };

  const prevTemp = previousState.thermalAccumulators.get(comp.id) || ambientTemp;
  const maxTemp = model.maxTemperature || 70;

  // Simplified thermal model: P_loss = I²R
  const branchR = model.branches.length > 0 ? model.branches[0].resistance : 0.01;
  const powerLoss = current * current * branchR;

  // Thermal resistance (K/W) - small components dissipate heat quickly
  const thermalR = model.thermalResistance || 2; // Default 2 K/W for normal components

  // Temperature rise: ΔT = P × R_thermal
  const tempRise = powerLoss * thermalR;

  // Target temperature
  const targetTemp = ambientTemp + tempRise;

  // Thermal time constant (simplified first-order model)
  const thermalTimeConstant = 300; // seconds (5 minutes)
  const alpha = Math.min(1, 1 / (thermalTimeConstant * config.tickHz));
  const newTemp = prevTemp + alpha * (targetTemp - prevTemp);

  // Clamp to reasonable range
  const clampedTemp = Math.max(ambientTemp, Math.min(newTemp, 300));

  // Update accumulator
  previousState.thermalAccumulators.set(comp.id, clampedTemp);

  // Determine thermal state
  let state: ThermalState;
  if (clampedTemp > maxTemp) {
    state = "OVERHEATED";
  } else if (clampedTemp > maxTemp * 0.8) {
    state = "HOT";
  } else if (clampedTemp > maxTemp * 0.6) {
    state = "WARM";
  } else {
    state = "NORMAL";
  }

  return { state, temperature: clampedTemp };
}

// --- Build cable states ----------------------------------------------------

function buildCableStates(
  circuit: CircuitModel,
  graph: ElectricalGraph,
  solverResult: SolverResult,
  config: SimulationConfig
): Record<string, CableState> {
  const states: Record<string, CableState> = {};

  for (const cable of circuit.cables) {
    const edgeId = `cable_${cable.id}`;
    const branchState = solverResult.branchStates.find(b => b.branchId === edgeId);

    const current = branchState?.current || 0;
    const voltageDrop = branchState?.voltageDrop || 0;
    const powerLoss = branchState ? Math.abs(branchState.power) : 0;

    // Calculate temperature using simplified thermal model
    // P_loss = I²R, ΔT = P × R_thermal
    const cableR = (cable.cable.resistivity * cable.cable.length) / cable.cable.crossSection;
    const powerLossCalc = current * current * cableR;
    const cableThermalR = 3.5; // K/W typical for cable in conduit
    const tempRise = powerLossCalc * cableThermalR;
    const temperature = config.ambientTemperature + tempRise;

    // Calculate loading (based on typical ampacity)
    const ampacity = estimateAmpacity(cable.cable.crossSection, cable.cable.conductorMaterial);
    const loading = ampacity > 0 ? (current / ampacity) * 100 : 0;

    states[cable.id] = {
      id: cable.id,
      current,
      voltageDrop,
      powerLoss,
      temperature,
      loading,
      isOverloaded: loading > 100,
      isOverheated: temperature > cable.cable.maxTemperature,
    };
  }

  return states;
}

function estimateAmpacity(crossSection: number, material: "copper" | "aluminum"): number {
  // Simplified ampacity table (A) for PVC insulated cables in conduit
  // Based on IEC 60364-5-52
  const copperTable: Record<number, number> = {
    1.0: 11, 1.5: 14.5, 2.5: 20, 4: 26, 6: 34, 10: 46,
    16: 61, 25: 80, 35: 99, 50: 119, 70: 151, 95: 182,
    120: 210, 150: 240, 185: 273, 240: 321,
  };
  const aluminumTable: Record<number, number> = {
    16: 47, 25: 63, 35: 78, 50: 94, 70: 120, 95: 144,
    120: 166, 150: 189, 185: 216, 240: 254,
  };

  const table = material === "copper" ? copperTable : aluminumTable;
  return table[crossSection] || crossSection * 6; // fallback estimation
}

// --- Detect faults ---------------------------------------------------------

function detectFaults(
  circuit: CircuitModel,
  componentStates: Record<string, ComponentState>,
  solverResult: SolverResult
): FaultResult[] {
  const faults: FaultResult[] = [];

  for (const comp of circuit.components) {
    if (comp.fault === "NONE") continue;

    const state = componentStates[comp.id];
    if (!state) continue;

    let current = 0;
    let impedance = 0;

    if (comp.fault === "SHORT") {
      impedance = (comp.faultParameters?.impedance as number) || 0.001;
      // Get fault current from the solver
      const shortCurrent = Object.values(state.terminalCurrents).reduce((a, b) => Math.max(a, b), 0);
      current = shortCurrent;
    } else if (comp.fault === "LEAK") {
      impedance = (comp.faultParameters?.impedance as number) || 100;
      current = state.totalCurrent;
    }

    faults.push({
      faultType: comp.fault,
      componentId: comp.id,
      location: comp.id,
      current,
      impedance,
      active: true,
    });
  }

  return faults;
}

// --- Calculate summary -----------------------------------------------------

function calculateSummary(
  result: SimulationResult,
  circuit: CircuitModel,
  config: SimulationConfig
): void {
  let totalActivePower = 0;
  let totalReactivePower = 0;
  let sourceCurrent = 0;
  let maxTemp = config.ambientTemperature;
  let energizedLoads = 0;

  for (const comp of circuit.components) {
    const state = result.componentStates[comp.id];
    if (!state) continue;

    const model = getComponentModel(comp.typeId);

    if (model?.category === "source") {
      // Get source current
      sourceCurrent = Math.max(sourceCurrent, state.totalCurrent);
    }

    if (model?.category === "load" || model?.category === "residential" || model?.load) {
      if (state.totalCurrent > 0.001) {
        energizedLoads++;
        totalActivePower += state.totalPower;
        totalReactivePower += state.totalReactivePower;
      }
    }

    maxTemp = Math.max(maxTemp, state.temperature);
  }

  result.summary = {
    totalActivePower,
    totalReactivePower,
    totalApparentPower: Math.sqrt(totalActivePower * totalActivePower + totalReactivePower * totalReactivePower),
    sourceCurrent,
    maxTemperature: maxTemp,
    energizedLoads,
    activeFaults: result.faults.filter(f => f.active).length,
    trippedProtections: result.protections.filter(p => p.tripped).length,
  };
}

// --- Re-export types --------------------------------------------------------

export * from "./types";
