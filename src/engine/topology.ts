// ============================================================================
// ElectroVoltio - Topology Builder
// Builds the electrical graph from circuit components and cables
// ============================================================================

import {
  CircuitModel,
  CircuitComponent,
  CableConnection,
  ElectricalComponentModel,
  TopologyResult,
  TerminalDefinition,
  Phase,
  ConductorRole,
} from "./types";
import { getComponentModel } from "@/data/catalog";

// --- Node: represents a unique terminal on a specific component ------------
export interface GraphNode {
  id: string;              // "componentId:terminalId"
  componentId: string;
  terminalId: string;
  phase: Phase;
  role: ConductorRole;
  voltage: number;
  voltageAngle: number;
}

// --- Edge: represents a connection (cable or internal branch) ---------------
export interface GraphEdge {
  id: string;
  from: string;            // GraphNode id
  to: string;              // GraphNode id
  resistance: number;
  reactance: number;
  impedance: number;
  phase: Phase;
  enabled: boolean;
  source: "cable" | "internal";
  componentId?: string;
  cableId?: string;
  current: number;
  currentAngle: number;
}

export interface ElectricalGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  adjacency: Map<string, string[]>; // nodeId -> edge ids
  nodePhases: Map<string, Set<Phase>>;
}

// --- Build graph from circuit model -----------------------------------------

export function buildTopology(
  circuit: CircuitModel,
  mechanicalStates?: Map<string, string>
): { graph: ElectricalGraph; topology: TopologyResult; errors: string[] } {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, string[]>();
  const errors: string[] = [];

  // 1. Create nodes for all component terminals
  for (const comp of circuit.components) {
    const model = getComponentModel(comp.typeId);
    if (!model) {
      errors.push(`Unknown component type: ${comp.typeId}`);
      continue;
    }

    for (const term of model.terminals) {
      const nodeId = `${comp.id}:${term.id}`;
      nodes.set(nodeId, {
        id: nodeId,
        componentId: comp.id,
        terminalId: term.id,
        phase: term.phase,
        role: term.role,
        voltage: 0,
        voltageAngle: 0,
      });
      if (!adjacency.has(nodeId)) {
        adjacency.set(nodeId, []);
      }
    }

    // 2. Create internal branches (if device is conducting)
    const mechState = mechanicalStates?.get(comp.id) || comp.mechanicalState;
    const isConducting = mechState === "CLOSED" || mechState === "WELDED";

    // Sources always conduct
    const isSource = model.category === "source";
    const isPassive = model.category === "instrument";

    for (const branch of model.branches) {
      const fromNodeId = `${comp.id}:${branch.fromTerminal}`;
      const toNodeId = `${comp.id}:${branch.toTerminal}`;

      if (!nodes.has(fromNodeId) || !nodes.has(toNodeId)) {
        errors.push(`Invalid branch terminal for ${comp.id}: ${branch.fromTerminal} -> ${branch.toTerminal}`);
        continue;
      }

      // Determine if branch should be enabled
    let branchEnabled = branch.enabled;
    if (!isSource && !isPassive && !isConducting) {
      branchEnabled = false;
    }

    // Handle fault impedance modifications
      let branchR = branch.resistance;
      let branchX = branch.reactance;

    // Any load, EV charging, or residential component can be switched off/on by the user
    if (comp.properties?.powered === false) {
      branchEnabled = false;
    }

    // Residential control devices (switches, timers, sensors, sockets, loads)
    // open/close their internal path according to live properties.
    const control = model.residentialControl;
    if (control) {
      const forcedOff = comp.properties?.powered === false;
      const timedActive = typeof comp.properties?.timerEndsAt === "number"
        ? Date.now() < (comp.properties.timerEndsAt as number)
        : undefined;
      const programActive = timedActive !== undefined
        ? timedActive
        : (comp.properties?.programActive as boolean | undefined);
      const dimmerLevel = typeof comp.properties?.dimmerLevel === "number"
        ? Math.max(0, Math.min(100, comp.properties.dimmerLevel as number))
        : 100;

      let shouldConduct = isConducting;
      if (forcedOff) {
        shouldConduct = false;
      } else if (programActive !== undefined) {
        shouldConduct = programActive;
      } else if (control.defaultOn === false && comp.properties?.programActive === undefined && comp.properties?.powered === undefined) {
        shouldConduct = false;
      }

      if (control.supportsDimmer && dimmerLevel <= 1) {
        shouldConduct = false;
      }

      if (!shouldConduct) {
        branchEnabled = false;
      } else if (control.supportsDimmer && dimmerLevel < 100) {
        const factor = Math.max(0.05, dimmerLevel / 100);
        branchR = branchR / factor;
      }
    } else if (comp.typeId === "load_timer") {
      const programActive = comp.properties?.programActive !== false;
      if (!programActive) branchEnabled = false;
    }

      if (comp.fault === "SHORT") {
        // Short circuit adds a very low impedance path
        const faultZ = (comp.faultParameters?.impedance as number) || 0.001;
        branchR = faultZ;
        branchX = 0;
        branchEnabled = true;
      } else if (comp.fault === "OPEN") {
        branchEnabled = false;
      } else if (comp.fault === "LEAK") {
        // Leak adds a path to PE
        // This is handled separately in fault injection
      }

      const edgeId = `int_${comp.id}_${branch.id}`;
      const edge: GraphEdge = {
        id: edgeId,
        from: fromNodeId,
        to: toNodeId,
        resistance: branchR,
        reactance: branchX,
        impedance: Math.sqrt(branchR * branchR + branchX * branchX),
        phase: branch.phase,
        enabled: branchEnabled,
        source: "internal",
        componentId: comp.id,
        current: 0,
        currentAngle: 0,
      };

      edges.push(edge);

      if (branchEnabled) {
        adjacency.get(fromNodeId)?.push(edgeId);
        adjacency.get(toNodeId)?.push(edgeId);
      }
    }
  }

  // 3. Create cable edges
  for (const cable of circuit.cables) {
    const fromNodeId = `${cable.fromComponentId}:${cable.fromTerminalId}`;
    const toNodeId = `${cable.toComponentId}:${cable.toTerminalId}`;

    if (!nodes.has(fromNodeId)) {
      errors.push(`Cable from non-existent node: ${fromNodeId}`);
      continue;
    }
    if (!nodes.has(toNodeId)) {
      errors.push(`Cable to non-existent node: ${toNodeId}`);
      continue;
    }

    // Check phase compatibility
    const fromNode = nodes.get(fromNodeId)!;
    const toNode = nodes.get(toNodeId)!;

    if (!arePhasesCompatible(fromNode.phase, toNode.phase, fromNode.role, toNode.role)) {
      errors.push(`Incompatible phases: ${fromNodeId} (${fromNode.phase}/${fromNode.role}) -> ${toNodeId} (${toNode.phase}/${toNode.role})`);
    }

    // Cable impedance: R = ρ·L/S, with temperature correction
    const { resistivity, crossSection, length, reactancePerKm } = cable.cable;
    const cableR = (resistivity * length) / crossSection;
    const cableX = (reactancePerKm * length) / 1000;
    const cableZ = Math.sqrt(cableR * cableR + cableX * cableX);

    const edgeId = `cable_${cable.id}`;
    const edge: GraphEdge = {
      id: edgeId,
      from: fromNodeId,
      to: toNodeId,
      resistance: cableR,
      reactance: cableX,
      impedance: cableZ,
      phase: fromNode.phase,
      enabled: true,
      source: "cable",
      cableId: cable.id,
      current: 0,
      currentAngle: 0,
    };

    edges.push(edge);
    adjacency.get(fromNodeId)?.push(edgeId);
    adjacency.get(toNodeId)?.push(edgeId);
  }

  // 4. Inject leak fault paths (L -> PE)
  for (const comp of circuit.components) {
    if (comp.fault === "LEAK") {
      const model = getComponentModel(comp.typeId);
      if (!model) continue;

      const leakImpedance = (comp.faultParameters?.impedance as number) || 100;

      // Find phase and PE terminals
      const phaseTerminals = model.terminals.filter(t => t.role === "phase");
      const peTerminal = model.terminals.find(t => t.role === "protective");

      if (peTerminal) {
        for (const pt of phaseTerminals) {
          const fromNodeId = `${comp.id}:${pt.id}`;
          const toNodeId = `${comp.id}:${peTerminal.id}`;

          if (nodes.has(fromNodeId) && nodes.has(toNodeId)) {
            const edgeId = `leak_${comp.id}_${pt.id}`;
            const edge: GraphEdge = {
              id: edgeId,
              from: fromNodeId,
              to: toNodeId,
              resistance: leakImpedance,
              reactance: 0,
              impedance: leakImpedance,
              phase: pt.phase,
              enabled: true,
              source: "internal",
              componentId: comp.id,
              current: 0,
              currentAngle: 0,
            };
            edges.push(edge);
            adjacency.get(fromNodeId)?.push(edgeId);
            adjacency.get(toNodeId)?.push(edgeId);
          }
        }
      }
    }
  }

  // 5. Build topology result
  const nodeIds = Array.from(nodes.keys());
  const connectedComponents = findConnectedComponents(nodeIds, adjacency);

  // Check if all loads have a complete path (supply + return)
  const loadComponents = circuit.components.filter(c => {
    const model = getComponentModel(c.typeId);
    return model?.category === "load";
  });

  const incompleteLoads: string[] = [];
  for (const loadComp of loadComponents) {
    const model = getComponentModel(loadComp.typeId);
    if (!model || !model.load) continue;

    // Check if there's a path from any phase terminal back through neutral/PE
    const phaseTerms = model.terminals.filter(t => t.role === "phase");
    const returnTerms = model.terminals.filter(t =>
      t.role === "neutral" || t.role === "protective" || t.role === "negative"
    );

    let hasCompletePath = false;
    for (const pt of phaseTerms) {
      for (const rt of returnTerms) {
        const fromId = `${loadComp.id}:${pt.id}`;
        const toId = `${loadComp.id}:${rt.id}`;
        if (nodes.has(fromId) && nodes.has(toId)) {
          // Check if both nodes are in the same connected component
          const fromCC = connectedComponents.findIndex(cc => cc.includes(fromId));
          const toCC = connectedComponents.findIndex(cc => cc.includes(toId));
          if (fromCC !== -1 && fromCC === toCC) {
            hasCompletePath = true;
            break;
          }
        }
      }
      if (hasCompletePath) break;
    }

    if (!hasCompletePath) {
      incompleteLoads.push(loadComp.id);
    }
  }

  const topology: TopologyResult = {
    nodes: nodeIds,
    edges: edges.filter(e => e.enabled).map(e => e.id),
    connectedComponents: connectedComponents.length,
    isComplete: incompleteLoads.length === 0,
    islands: connectedComponents,
  };

  return { graph: { nodes, edges, adjacency, nodePhases: new Map() }, topology, errors };
}

// --- Phase compatibility ---------------------------------------------------

function arePhasesCompatible(
  phaseA: Phase, phaseB: Phase,
  roleA: ConductorRole, roleB: ConductorRole
): boolean {
  // Same phase always compatible
  if (phaseA === phaseB) return true;

  // PE is compatible with PE only
  if (phaseA === "PE" || phaseB === "PE") {
    return phaseA === "PE" && phaseB === "PE";
  }

  // N is compatible with N only
  if (phaseA === "N" || phaseB === "N") {
    return phaseA === "N" && phaseB === "N";
  }

  // Phase conductors can connect to same phase
  if (isPhaseConductor(phaseA) && isPhaseConductor(phaseB)) {
    return phaseA === phaseB;
  }

  // DC conductors
  if (phaseA === "POS" || phaseA === "NEG" || phaseB === "POS" || phaseB === "NEG") {
    return phaseA === phaseB;
  }

  return false;
}

function isPhaseConductor(phase: Phase): boolean {
  return phase === "L1" || phase === "L2" || phase === "L3";
}

// --- Connected components (Union-Find) -------------------------------------

function findConnectedComponents(
  nodeIds: string[],
  adjacency: Map<string, string[]>
): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  // Build actual adjacency list (node -> neighboring nodes)
  const neighborMap = new Map<string, Set<string>>();

  for (const nodeId of nodeIds) {
    neighborMap.set(nodeId, new Set());
  }

  // For each node, find edges and add neighbors
  for (const nodeId of nodeIds) {
    const edgeIds = adjacency.get(nodeId) || [];
    for (const edgeId of edgeIds) {
      // Parse edge to find other node
      // We'll handle this through BFS with edge traversal
    }
  }

  // Simple BFS using adjacency
  for (const startNode of nodeIds) {
    if (visited.has(startNode)) continue;

    const component: string[] = [];
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      const edgeIds = adjacency.get(current) || [];
      for (const edgeId of edgeIds) {
        // Find the other end of the edge
        const parts = edgeId.split("_");
        // Edge IDs are structured but we need to track from/to
        // Let's use a different approach: track edge -> nodes mapping
      }
    }

    components.push(component);
  }

  // The above BFS approach with edge IDs won't work directly.
  // Let's use a proper union-find approach.
  return unionFind(nodeIds, adjacency);
}

function unionFind(
  nodeIds: string[],
  adjacency: Map<string, string[]>
): string[][] {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  for (const id of nodeIds) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  function find(x: string): string {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    const rankA = rank.get(ra)!;
    const rankB = rank.get(rb)!;
    if (rankA < rankB) {
      parent.set(ra, rb);
    } else if (rankA > rankB) {
      parent.set(rb, ra);
    } else {
      parent.set(rb, ra);
      rank.set(ra, rankA + 1);
    }
  }

  // We need to iterate over edges and union their endpoints
  const processedEdges = new Set<string>();

  for (const nodeId of nodeIds) {
    const edgeIds = adjacency.get(nodeId) || [];
    for (const edgeId of edgeIds) {
      if (processedEdges.has(edgeId)) continue;
      processedEdges.add(edgeId);

      // Parse edge to find the two endpoints
      // Edge IDs for cables: "cable_xxx"
      // Edge IDs for internal: "int_compId_branchId"
      // We need to extract the from/to from the edge structure
      // Actually, we stored adjacency as nodeId -> edgeIds
      // So we need the actual edge data to know the endpoints
      // Let's use a global edge registry
    }
  }

  // Since we can't easily get edge endpoints from just the edgeId string,
  // we need to pass the edges array. Let me refactor.

  // For now, build from adjacency:
  // Each edge appears in adjacency of exactly 2 nodes (from and to)
  // So we can find pairs
  const edgeToNodes = new Map<string, string[]>();
  for (const nodeId of nodeIds) {
    const edgeIds = adjacency.get(nodeId) || [];
    for (const edgeId of edgeIds) {
      if (!edgeToNodes.has(edgeId)) {
        edgeToNodes.set(edgeId, []);
      }
      edgeToNodes.get(edgeId)!.push(nodeId);
    }
  }

  for (const [, nodesInEdge] of edgeToNodes) {
    if (nodesInEdge.length === 2) {
      union(nodesInEdge[0], nodesInEdge[1]);
    }
  }

  // Group by root
  const groups = new Map<string, string[]>();
  for (const id of nodeIds) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(id);
  }

  return Array.from(groups.values());
}

// --- Check if source and load are in same connected component ---------------

export function areNodesConnected(
  graph: ElectricalGraph,
  nodeA: string,
  nodeB: string
): boolean {
  const visited = new Set<string>();
  const queue = [nodeA];
  visited.add(nodeA);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === nodeB) return true;

    const edgeIds = graph.adjacency.get(current) || [];
    for (const edgeId of edgeIds) {
      const edge = graph.edges.find(e => e.id === edgeId);
      if (!edge || !edge.enabled) continue;

      const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

// --- Find all paths between two nodes --------------------------------------

export function findAllPaths(
  graph: ElectricalGraph,
  start: string,
  end: string,
  maxDepth: number = 20
): string[][] {
  const paths: string[][] = [];

  function dfs(current: string, target: string, path: string[], visited: Set<string>) {
    if (path.length > maxDepth) return;
    if (current === target) {
      paths.push([...path]);
      return;
    }

    const edgeIds = graph.adjacency.get(current) || [];
    for (const edgeId of edgeIds) {
      const edge = graph.edges.find(e => e.id === edgeId);
      if (!edge || !edge.enabled) continue;

      const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);
        dfs(neighbor, target, path, visited);
        path.pop();
        visited.delete(neighbor);
      }
    }
  }

  const visited = new Set([start]);
  dfs(start, end, [start], visited);
  return paths;
}
