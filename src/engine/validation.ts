// ============================================================================
// ElectroVoltio - Normative Validation
// Checks circuits against electrical standards (REBT, IEC)
// ============================================================================

import {
  CircuitModel,
  NormativeViolation,
  SimulationResult,
  ComponentState,
  CableState,
} from "./types";
import { ElectricalGraph } from "./topology";
import { getComponentModel } from "@/data/catalog";

export function validateCircuit(
  circuit: CircuitModel,
  graph: ElectricalGraph,
  simulationResult: SimulationResult
): NormativeViolation[] {
  const violations: NormativeViolation[] = [];

  // 1. Check for missing PE connections
  checkMissingPE(circuit, violations);

  // 2. Check for missing RCD protection
  checkMissingRCD(circuit, graph, violations);

  // 3. Check cable sizing
  checkCableSizing(circuit, simulationResult.cableStates, violations);

  // 4. Check protection coordination
  checkProtectionCoordination(circuit, simulationResult, violations);

  // 5. Check voltage drop
  checkVoltageDrop(circuit, simulationResult, violations);

  // 6. Check for open circuits on loads
  checkLoadConnections(circuit, simulationResult, violations);

  // 7. Check for incompatible connections
  checkIncompatibleConnections(circuit, violations);

  // 8. Check source compatibility
  checkSourceCompatibility(circuit, violations);

  return violations;
}

// --- Missing PE check ------------------------------------------------------

function checkMissingPE(circuit: CircuitModel, violations: NormativeViolation[]) {
  const sources = circuit.components.filter(c => {
    const m = getComponentModel(c.typeId);
    return m?.category === "source";
  });

  const hasPESource = sources.some(s => {
    const m = getComponentModel(s.typeId);
    return m?.terminals.some(t => t.role === "protective");
  });

  const loadsNeedPE = circuit.components.some(c => {
    const m = getComponentModel(c.typeId);
    return m?.category === "load" && m.terminals.some(t => t.role === "protective");
  });

  if (loadsNeedPE && !hasPESource) {
    violations.push({
      ruleId: "MISSING_PE_SOURCE",
      severity: "violation",
      message: "No hay fuente con conductor de protección (PE). Los equipos requieren conexión a tierra.",
      reference: "REBT ITC-BT-18",
    });
  }
}

// --- Missing RCD check -----------------------------------------------------

function checkMissingRCD(
  circuit: CircuitModel,
  graph: ElectricalGraph,
  violations: NormativeViolation[]
) {
  // Check if there's at least one RCD for residential circuits
  const hasRCD = circuit.components.some(c => {
    const m = getComponentModel(c.typeId);
    return m?.protection?.protectionType === "RCD";
  });

  const hasResidentialLoads = circuit.components.some(c => {
    const m = getComponentModel(c.typeId);
    return m?.category === "residential" ||
      (m?.category === "load" && m.terminals.some(t => t.role === "protective"));
  });

  if (hasResidentialLoads && !hasRCD) {
    violations.push({
      ruleId: "MISSING_RCD",
      severity: "violation",
      message: "Circuito residencial sin protección diferencial. Se requiere RCD ≤30mA.",
      reference: "REBT ITC-BT-24",
    });
  }
}

// --- Cable sizing ----------------------------------------------------------

function checkCableSizing(
  circuit: CircuitModel,
  cableStates: Record<string, CableState>,
  violations: NormativeViolation[]
) {
  for (const cable of circuit.cables) {
    const state = cableStates[cable.id];
    if (!state) continue;

    // Check if cable is overloaded
    if (state.isOverloaded) {
      violations.push({
        ruleId: "CABLE_OVERLOAD",
        severity: "violation",
        cableId: cable.id,
        message: `Cable ${cable.id} sobrecargado: ${state.loading.toFixed(0)}% de capacidad.`,
        reference: "IEC 60364-5-52",
      });
    }

    // Minimum cross-section for power circuits
    if (cable.cable.crossSection < 1.5) {
      violations.push({
        ruleId: "CABLE_MIN_SECTION",
        severity: "warning",
        cableId: cable.id,
        message: `Sección del cable ${cable.id} (${cable.cable.crossSection}mm²) inferior al mínimo recomendado (1.5mm²).`,
        reference: "IEC 60364-5-52",
      });
    }
  }
}

// --- Protection coordination -----------------------------------------------

function checkProtectionCoordination(
  circuit: CircuitModel,
  result: SimulationResult,
  violations: NormativeViolation[]
) {
  // Check that upstream protection has higher rating than downstream
  const protections = circuit.components.filter(c => {
    const m = getComponentModel(c.typeId);
    return m?.protection;
  });

  for (const prot of protections) {
    const model = getComponentModel(prot.typeId);
    if (!model?.protection) continue;

    const state = result.componentStates[prot.id];
    if (!state) continue;

    // Check if protection can break the available fault current
    if (model.protection.breakingCapacity) {
      const breakingCapacityA = model.protection.breakingCapacity * 1000;
      // Check against short circuit currents
      for (const fault of result.faults) {
        if (fault.faultType === "SHORT" && fault.current > breakingCapacityA) {
          violations.push({
            ruleId: "BREAKING_CAPACITY",
            severity: "violation",
            componentId: prot.id,
            message: `Protección ${prot.id} tiene poder de corte (${model.protection.breakingCapacity}kA) inferior a la corriente de cortocircuito (${(fault.current / 1000).toFixed(1)}kA).`,
            reference: "IEC 60947-2",
          });
        }
      }
    }
  }
}

// --- Voltage drop ----------------------------------------------------------

function checkVoltageDrop(
  circuit: CircuitModel,
  result: SimulationResult,
  violations: NormativeViolation[]
) {
  // Check voltage at loads vs nominal
  for (const comp of circuit.components) {
    const model = getComponentModel(comp.typeId);
    if (!model?.load) continue;

    const state = result.componentStates[comp.id];
    if (!state) continue;

    if (model.ratedVoltage && model.ratedVoltage > 0) {
      // Calculate voltage between phase and return terminals (not averaging N/PE at 0V)
      const phaseTerms = model.terminals.filter(t => t.role === "phase" || t.role === "positive");
      const returnTerms = model.terminals.filter(t => t.role === "neutral" || t.role === "protective" || t.role === "negative");
      let maxPhaseV = 0;
      for (const pt of phaseTerms) {
        const pv = state.terminalVoltages[pt.id] || 0;
        for (const rt of returnTerms) {
          if (pt.id === rt.id) continue;
          const rv = state.terminalVoltages[rt.id] || 0;
          maxPhaseV = Math.max(maxPhaseV, Math.abs(pv - rv));
        }
      }
      if (maxPhaseV === 0 && phaseTerms.length > 0) {
        maxPhaseV = Math.max(...phaseTerms.map(t => state.terminalVoltages[t.id] || 0));
      }
      if (maxPhaseV === 0) continue;

      const dropPercent = ((model.ratedVoltage - maxPhaseV) / model.ratedVoltage) * 100;

      if (dropPercent > 5) {
        violations.push({
          ruleId: "VOLTAGE_DROP_EXCESSIVE",
          severity: "violation",
          componentId: comp.id,
          message: `Caída de tensión excesiva en ${comp.id}: ${dropPercent.toFixed(1)}% (máximo 5%).`,
          reference: "IEC 60364-5-52",
        });
      } else if (dropPercent > 3) {
        violations.push({
          ruleId: "VOLTAGE_DROP_HIGH",
          severity: "warning",
          componentId: comp.id,
          message: `Caída de tensión elevada en ${comp.id}: ${dropPercent.toFixed(1)}% (recomendado <3%).`,
          reference: "IEC 60364-5-52",
        });
      }
    }
  }
}

// --- Load connections check -------------------------------------------------

function checkLoadConnections(
  circuit: CircuitModel,
  result: SimulationResult,
  violations: NormativeViolation[]
) {
  for (const comp of circuit.components) {
    const state = result.componentStates[comp.id];
    if (!state) continue;

    const model = getComponentModel(comp.typeId);
    if (!model) continue;

    if (model.category === "load" && state.electrical === "DEENERGIZED") {
      // Check if it's intentionally off or if there's a connection problem
      const hasSupplyCable = circuit.cables.some(
        c => c.toComponentId === comp.id || c.fromComponentId === comp.id
      );

      if (hasSupplyCable) {
        violations.push({
          ruleId: "LOAD_DEENERGIZED",
          severity: "warning",
          componentId: comp.id,
          message: `Carga ${comp.id} (${model.name}) no está energizada. Verifique conexiones.`,
        });
      }
    }
  }
}

// --- Incompatible connections ----------------------------------------------

function checkIncompatibleConnections(
  circuit: CircuitModel,
  violations: NormativeViolation[]
) {
  for (const cable of circuit.cables) {
    const fromComp = circuit.components.find(c => c.id === cable.fromComponentId);
    const toComp = circuit.components.find(c => c.id === cable.toComponentId);

    if (!fromComp || !toComp) continue;

    const fromModel = getComponentModel(fromComp.typeId);
    const toModel = getComponentModel(toComp.typeId);

    if (!fromModel || !toModel) continue;

    const fromTerminal = fromModel.terminals.find(t => t.id === cable.fromTerminalId);
    const toTerminal = toModel.terminals.find(t => t.id === cable.toTerminalId);

    if (!fromTerminal || !toTerminal) continue;

    // Check AC/DC compatibility
    const fromIsDC = fromTerminal.phase === "POS" || fromTerminal.phase === "NEG";
    const toIsDC = toTerminal.phase === "POS" || toTerminal.phase === "NEG";
    const fromIsAC = fromTerminal.phase === "L1" || fromTerminal.phase === "L2" || fromTerminal.phase === "L3";
    const toIsAC = toTerminal.phase === "L1" || toTerminal.phase === "L2" || toTerminal.phase === "L3";

    if ((fromIsDC && toIsAC) || (fromIsAC && toIsDC)) {
      violations.push({
        ruleId: "AC_DC_MISMATCH",
        severity: "violation",
        cableId: cable.id,
        message: `Conexión incompatível AC/DC en cable ${cable.id}.`,
      });
    }

    // Check polarity
    if (fromTerminal.phase === "POS" && toTerminal.phase === "NEG" &&
        fromTerminal.role === "positive" && toTerminal.role === "negative") {
      violations.push({
        ruleId: "POLARITY_REVERSED",
        severity: "violation",
        cableId: cable.id,
        message: `Polaridad invertida en cable ${cable.id}: POS conectado a NEG.`,
      });
    }

    // Check PE connections
    if (fromTerminal.phase === "PE" && toTerminal.phase !== "PE") {
      violations.push({
        ruleId: "PE_MISUSE",
        severity: "violation",
        cableId: cable.id,
        message: `Conductor PE conectado incorrectamente a terminal de diferente fase.`,
      });
    }
  }
}

// --- Source compatibility --------------------------------------------------

function checkSourceCompatibility(
  circuit: CircuitModel,
  violations: NormativeViolation[]
) {
  const sources = circuit.components.filter(c => {
    const m = getComponentModel(c.typeId);
    return m?.source;
  });

  if (sources.length > 1) {
    // Check if sources are connected in parallel (to same nodes)
    // This is a simplified check
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const m1 = getComponentModel(sources[i].typeId);
        const m2 = getComponentModel(sources[j].typeId);

        if (m1?.source && m2?.source) {
          // Check if same voltage and type
          if (m1.source.voltage !== m2.source.voltage ||
              m1.source.sourceType !== m2.source.sourceType) {
            // Check if they share any cables
            const s1Cables = circuit.cables.filter(
              c => c.fromComponentId === sources[i].id || c.toComponentId === sources[i].id
            );
            const s2Cables = circuit.cables.filter(
              c => c.fromComponentId === sources[j].id || c.toComponentId === sources[j].id
            );

            // Simple check: if they have cables to same components
            const s1Targets = new Set(s1Cables.map(c =>
              c.fromComponentId === sources[i].id ? c.toComponentId : c.fromComponentId
            ));
            const s2Targets = new Set(s2Cables.map(c =>
              c.fromComponentId === sources[j].id ? c.toComponentId : c.fromComponentId
            ));

            let shared = false;
            for (const t of s1Targets) {
              if (s2Targets.has(t)) { shared = true; break; }
            }

            if (shared && (m1.source.voltage !== m2.source.voltage ||
                m1.source.sourceType !== m2.source.sourceType)) {
              violations.push({
                ruleId: "INCOMPATIBLE_SOURCES",
                severity: "violation",
                componentId: sources[i].id,
                message: `Fuentes incompatibles conectadas en paralelo: ${sources[i].id} y ${sources[j].id}.`,
              });
            }
          }
        }
      }
    }
  }
}
