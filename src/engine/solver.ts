// ============================================================================
// ElectroVoltio - Electrical Solver
// Nodal analysis for AC/DC circuits
// Solves for node voltages and branch currents
// ============================================================================

import {
  CircuitModel,
  SimulationConfig,
  NodeElectricalState,
  BranchElectricalState,
  SourceModel,
} from "./types";
import { ElectricalGraph, GraphNode, GraphEdge } from "./topology";
import { getComponentModel } from "@/data/catalog";

export interface SolverResult {
  converged: boolean;
  iterations: number;
  residual: number;
  nodeVoltages: Map<string, Complex>;
  branchCurrents: Map<string, Complex>;
  sourceCurrents: Map<string, Complex>; // componentId -> current through source
  nodeStates: NodeElectricalState[];
  branchStates: BranchElectricalState[];
}

// --- Complex number ---------------------------------------------------------

export class Complex {
  constructor(public re: number = 0, public im: number = 0) {}

  static fromPolar(mag: number, angle: number): Complex {
    return new Complex(mag * Math.cos(angle), mag * Math.sin(angle));
  }

  magnitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  angle(): number {
    return Math.atan2(this.im, this.re);
  }

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  div(other: Complex): Complex {
    const d = other.re * other.re + other.im * other.im;
    if (Math.abs(d) < 1e-20) return new Complex(0, 0);
    return new Complex(
      (this.re * other.re + this.im * other.im) / d,
      (this.im * other.re - this.re * other.im) / d
    );
  }

  conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }

  negate(): Complex {
    return new Complex(-this.re, -this.im);
  }

  isZero(tolerance: number = 1e-12): boolean {
    return this.magnitude() < tolerance;
  }
}

// --- Main solver ------------------------------------------------------------

export function solveCircuit(
  graph: ElectricalGraph,
  circuit: CircuitModel,
  config: SimulationConfig
): SolverResult {
  // 1. Identify nodes and build node mapping
  const nodeIds = Array.from(graph.nodes.keys());
  if (nodeIds.length === 0) {
    return {
      converged: true,
      iterations: 0,
      residual: 0,
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      sourceCurrents: new Map(),
      nodeStates: [],
      branchStates: [],
    };
  }

  // Assign ground node (first PE node, or first node)
  const groundNode = findGroundNode(graph, nodeIds);

  // Build reduced node list (excluding ground)
  const nonGroundNodes = nodeIds.filter(id => id !== groundNode);
  const nodeIndex = new Map<string, number>();
  nonGroundNodes.forEach((id, idx) => nodeIndex.set(id, idx));
  const N = nonGroundNodes.length;

  if (N === 0) {
    return {
      converged: true,
      iterations: 0,
      residual: 0,
      nodeVoltages: new Map([[groundNode, new Complex(0, 0)]]),
      branchCurrents: new Map(),
      sourceCurrents: new Map(),
      nodeStates: [{ nodeId: groundNode, voltage: 0, voltageAngle: 0, phase: "PE" }],
      branchStates: [],
    };
  }

  // 2. Collect voltage sources
  const voltageSources: VoltageSource[] = [];
  for (const comp of circuit.components) {
    const model = getComponentModel(comp.typeId);
    if (!model?.source) continue;

    const src = model.source;
    if (src.sourceType === "ac_single") {
      // L -> N voltage source
      const lNode = `${comp.id}:L`;
      const nNode = `${comp.id}:N`;
      if (nodeIds.includes(lNode) && nodeIds.includes(nNode)) {
        const magnitude = src.voltage;
        const angle = 0;
        voltageSources.push({
          positive: lNode,
          negative: nNode,
          voltage: Complex.fromPolar(magnitude, angle),
          componentId: comp.id,
        });
      }
    } else if (src.sourceType === "ac_three_phase") {
      const phaseAngles = src.phaseAngles || [0, -2 * Math.PI / 3, -4 * Math.PI / 3];
      const phases = ["L1", "L2", "L3"];
      for (let i = 0; i < 3; i++) {
        const phaseNode = `${comp.id}:${phases[i]}`;
        const nNode = `${comp.id}:N`;
        if (nodeIds.includes(phaseNode) && nodeIds.includes(nNode)) {
          voltageSources.push({
            positive: phaseNode,
            negative: nNode,
            voltage: Complex.fromPolar(src.voltage, phaseAngles[i]),
            componentId: comp.id,
          });
        }
      }
    } else if (src.sourceType === "dc") {
      const posNode = `${comp.id}:POS`;
      const negNode = `${comp.id}:NEG`;
      if (nodeIds.includes(posNode) && nodeIds.includes(negNode)) {
        voltageSources.push({
          positive: posNode,
          negative: negNode,
          voltage: new Complex(src.voltage, 0),
          componentId: comp.id,
        });
      }
    }
  }

  // 3. Build admittance matrix Y and current source vector I
  // Using Modified Nodal Analysis (MNA)
  // For N nodes and M voltage sources:
  // [Y  B] [v]   [i]
  // [C  D] [j] = [e]
  // where v = node voltages, j = voltage source currents

  const M = voltageSources.length;
  const size = N + M;

  if (size === 0) {
    return {
      converged: true,
      iterations: 0,
      residual: 0,
      nodeVoltages: new Map([[groundNode, new Complex(0, 0)]]),
      branchCurrents: new Map(),
      sourceCurrents: new Map(),
      nodeStates: [{ nodeId: groundNode, voltage: 0, voltageAngle: 0, phase: "PE" }],
      branchStates: [],
    };
  }

  // Initialize matrices (column-major for efficiency)
  const A: Complex[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Complex(0, 0))
  );
  const b: Complex[] = Array.from({ length: size }, () => new Complex(0, 0));

  // 4. Stamp admittance contributions from all branches
  const enabledEdges = graph.edges.filter(e => e.enabled);

  for (const edge of enabledEdges) {
    const fromIdx = nodeIndex.get(edge.from);
    const toIdx = nodeIndex.get(edge.to);

    // Y = 1/Z = 1/(R+jX)
    const z = new Complex(edge.resistance, edge.reactance);
    let y: Complex;
    if (z.isZero(1e-15)) {
      y = new Complex(1e6, 0); // Very high admittance for zero impedance
    } else {
      y = new Complex(1, 0).div(z);
    }

    // Stamp into Y matrix
    if (fromIdx !== undefined) {
      A[fromIdx][fromIdx] = A[fromIdx][fromIdx].add(y);
    }
    if (toIdx !== undefined) {
      A[toIdx][toIdx] = A[toIdx][toIdx].add(y);
    }
    if (fromIdx !== undefined && toIdx !== undefined) {
      A[fromIdx][toIdx] = A[fromIdx][toIdx].sub(y);
      A[toIdx][fromIdx] = A[toIdx][fromIdx].sub(y);
    }
  }

  // 5. Stamp voltage sources into MNA matrix
  for (let k = 0; k < M; k++) {
    const vs = voltageSources[k];
    const posIdx = nodeIndex.get(vs.positive);
    const negIdx = nodeIndex.get(vs.negative);

    // Row for voltage source equation
    const vsRow = N + k;

    if (posIdx !== undefined) {
      A[posIdx][vsRow] = A[posIdx][vsRow].add(new Complex(1, 0));
      A[vsRow][posIdx] = A[vsRow][posIdx].add(new Complex(1, 0));
    }
    if (negIdx !== undefined) {
      A[negIdx][vsRow] = A[negIdx][vsRow].sub(new Complex(1, 0));
      A[vsRow][negIdx] = A[vsRow][negIdx].sub(new Complex(1, 0));
    }

    // RHS: voltage source value
    b[vsRow] = vs.voltage;
  }

  // 6. Solve the system using Gaussian elimination with partial pivoting
  const solution = gaussianElimination(A, b, size);

  if (!solution) {
    return {
      converged: false,
      iterations: 0,
      residual: Infinity,
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      sourceCurrents: new Map(),
      nodeStates: [],
      branchStates: [],
    };
  }

  // 7. Extract node voltages
  const nodeVoltages = new Map<string, Complex>();
  nodeVoltages.set(groundNode, new Complex(0, 0));

  for (let i = 0; i < N; i++) {
    nodeVoltages.set(nonGroundNodes[i], solution[i]);
  }

  // 8. Calculate branch currents
  const branchCurrents = new Map<string, Complex>();

  for (const edge of enabledEdges) {
    const vFrom = nodeVoltages.get(edge.from) || new Complex(0, 0);
    const vTo = nodeVoltages.get(edge.to) || new Complex(0, 0);
    const vDrop = vFrom.sub(vTo);
    const z = new Complex(edge.resistance, edge.reactance);

    let current: Complex;
    if (z.isZero(1e-15)) {
      // For zero impedance, current is determined by the circuit
      current = vDrop.mul(new Complex(1e6, 0));
    } else {
      current = vDrop.div(z);
    }

    branchCurrents.set(edge.id, current);
  }

  // 9. Extract source currents from MNA solution
  const sourceCurrents = new Map<string, Complex>();
  for (let k = 0; k < M; k++) {
    const vs = voltageSources[k];
    const currentFromSolution = solution[N + k];
    const existing = sourceCurrents.get(vs.componentId) || new Complex(0, 0);
    // Sum currents for multi-phase sources (e.g., 3-phase)
    sourceCurrents.set(vs.componentId, existing.add(currentFromSolution));
  }

  // 10. Build result states
  const nodeStates: NodeElectricalState[] = [];
  for (const nodeId of nodeIds) {
    const v = nodeVoltages.get(nodeId) || new Complex(0, 0);
    const node = graph.nodes.get(nodeId)!;
    nodeStates.push({
      nodeId,
      voltage: v.magnitude(),
      voltageAngle: v.angle(),
      phase: node.phase,
    });
  }

  const branchStates: BranchElectricalState[] = [];
  for (const edge of enabledEdges) {
    const current = branchCurrents.get(edge.id) || new Complex(0, 0);
    const vFrom = nodeVoltages.get(edge.from) || new Complex(0, 0);
    const vTo = nodeVoltages.get(edge.to) || new Complex(0, 0);
    const vDrop = vFrom.sub(vTo);

    // Power: S = V × I*
    const powerComplex = vDrop.mul(current.conjugate());

    branchStates.push({
      branchId: edge.id,
      fromNode: edge.from,
      toNode: edge.to,
      current: current.magnitude(),
      currentAngle: current.angle(),
      power: powerComplex.re,        // Active power (W)
      reactivePower: powerComplex.im, // Reactive power (VAR)
      voltageDrop: vDrop.magnitude(),
      componentId: edge.componentId,
      cableId: edge.cableId,
    });
  }

  // Check convergence (residual of Ax - b)
  let maxResidual = 0;
  for (let i = 0; i < size; i++) {
    let sum = new Complex(0, 0);
    for (let j = 0; j < size; j++) {
      sum = sum.add(A[i][j].mul(solution[j]));
    }
    const residual = sum.sub(b[i]).magnitude();
    maxResidual = Math.max(maxResidual, residual);
  }

  return {
    converged: maxResidual < config.tolerance,
    iterations: 1, // Direct solver, single pass
    residual: maxResidual,
    nodeVoltages,
    branchCurrents,
    sourceCurrents,
    nodeStates,
    branchStates,
  };
}

// --- Helpers ----------------------------------------------------------------

interface VoltageSource {
  positive: string;
  negative: string;
  voltage: Complex;
  componentId: string;
}

function findGroundNode(graph: ElectricalGraph, nodeIds: string[]): string {
  // Prefer PE nodes
  for (const nodeId of nodeIds) {
    const node = graph.nodes.get(nodeId);
    if (node?.phase === "PE") return nodeId;
  }
  // Then N (neutral)
  for (const nodeId of nodeIds) {
    const node = graph.nodes.get(nodeId);
    if (node?.phase === "N") return nodeId;
  }
  // Then NEG (DC return)
  for (const nodeId of nodeIds) {
    const node = graph.nodes.get(nodeId);
    if (node?.phase === "NEG") return nodeId;
  }
  // Fallback to first node
  return nodeIds[0];
}

// --- Gaussian Elimination with Complex numbers -----------------------------

function gaussianElimination(
  A: Complex[][],
  b: Complex[],
  n: number
): Complex[] | null {
  // Copy matrices
  const a = A.map(row => [...row]);
  const rhs = [...b];

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxMag = a[col][col].magnitude();
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      const mag = a[row][col].magnitude();
      if (mag > maxMag) {
        maxMag = mag;
        maxRow = row;
      }
    }

    if (maxMag < 1e-15) {
      // Singular or nearly singular - try to continue with regularization
      a[col][col] = new Complex(1e-12, 0);
    }

    // Swap rows
    if (maxRow !== col) {
      [a[col], a[maxRow]] = [a[maxRow], a[col]];
      [rhs[col], rhs[maxRow]] = [rhs[maxRow], rhs[col]];
    }

    // Eliminate below
    const pivot = a[col][col];
    if (pivot.isZero(1e-15)) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = a[row][col].div(pivot);
      for (let j = col; j < n; j++) {
        a[row][j] = a[row][j].sub(factor.mul(a[col][j]));
      }
      rhs[row] = rhs[row].sub(factor.mul(rhs[col]));
    }
  }

  // Back substitution
  const x: Complex[] = Array.from({ length: n }, () => new Complex(0, 0));

  for (let row = n - 1; row >= 0; row--) {
    let sum = rhs[row];
    for (let col = row + 1; col < n; col++) {
      sum = sum.sub(a[row][col].mul(x[col]));
    }
    const diag = a[row][row];
    if (diag.isZero(1e-15)) {
      x[row] = new Complex(0, 0);
    } else {
      x[row] = sum.div(diag);
    }
  }

  return x;
}

// --- Utility: calculate apparent power --------------------------------------

export function calculateApparentPower(
  activePower: number,
  reactivePower: number
): number {
  return Math.sqrt(activePower * activePower + reactivePower * reactivePower);
}

// --- Utility: calculate power factor ----------------------------------------

export function calculatePowerFactor(
  activePower: number,
  apparentPower: number
): number {
  if (Math.abs(apparentPower) < 1e-10) return 1;
  return activePower / apparentPower;
}
