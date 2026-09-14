// ============================================================================
// ElectroVoltio - Terminal geometry (single source of truth)
// Used by Canvas and simulation UI so that a terminal's electrical node
// always matches its on-screen position. No visual-only offsets allowed.
// ============================================================================

import type { ComponentInstance } from "@/types/circuit";
import { getComponentModel } from "@/data/catalog";

export const COMPONENT_SIZE = 80;
export const TERMINAL_OFFSET = 4;

export interface Point {
  x: number;
  y: number;
}

/**
 * Returns the local (unrotated) position of a terminal relative to the
 * component origin. Uses the same layout the engine uses for node IDs.
 */
export function getTerminalLocalPosition(
  typeId: string,
  terminalId: string
): Point | null {
  const model = getComponentModel(typeId);
  if (!model) return null;
  const term = model.terminals.find((t) => t.id === terminalId);
  if (!term) return null;

  const half = COMPONENT_SIZE / 2;
  const off = TERMINAL_OFFSET;

  // 1. Dedicated layout: Cuadro 6 circuitos
  if (typeId === "dist_board_6way") {
    // Inputs on top edge
    if (term.id === "L_in") return { x: -24, y: -half - off };
    if (term.id === "N_in") return { x: 0, y: -half - off };
    if (term.id === "PE_in") return { x: 24, y: -half - off };

    // Neutral & PE outputs on left / bottom
    if (term.id === "N_out") return { x: -half - off, y: 15 };
    if (term.id === "PE_out") return { x: -half - off, y: -15 };

    // 6 outgoing phase circuits distributed evenly along the right edge
    const outPhaseMap: Record<string, number> = {
      L1_out: -25,
      L2_out: -15,
      L3_out: -5,
      L4_out: 5,
      L5_out: 15,
      L6_out: 25,
    };
    if (outPhaseMap[term.id] !== undefined) {
      return { x: half + off, y: outPhaseMap[term.id] };
    }
  }

  // 2. Dedicated layout: Cuadro 12 circuitos
  if (typeId === "dist_board_12way") {
    // Inputs on top edge
    if (term.id === "L_in") return { x: -24, y: -half - off };
    if (term.id === "N_in") return { x: 0, y: -half - off };
    if (term.id === "PE_in") return { x: 24, y: -half - off };

    // Neutral & PE bus outputs on bottom edge
    if (term.id === "N_out") return { x: -18, y: half + off };
    if (term.id === "PE_out") return { x: 18, y: half + off };

    // Circuits 1 to 6 on right edge
    const rightMap: Record<string, number> = {
      L1_out: -25,
      L2_out: -15,
      L3_out: -5,
      L4_out: 5,
      L5_out: 15,
      L6_out: 25,
    };
    if (rightMap[term.id] !== undefined) {
      return { x: half + off, y: rightMap[term.id] };
    }

    // Circuits 7 to 12 on left edge
    const leftMap: Record<string, number> = {
      L7_out: -25,
      L8_out: -15,
      L9_out: -5,
      L10_out: 5,
      L11_out: 15,
      L12_out: 25,
    };
    if (leftMap[term.id] !== undefined) {
      return { x: -half - off, y: leftMap[term.id] };
    }
  }

  // 3. Dedicated layout: Transformador 230/400V 5kVA
  if (typeId === "transformer_230_400_5kva") {
    // Primary side (input): left edge
    if (term.id === "L1_pri") return { x: -half - off, y: -16 };
    if (term.id === "N_pri") return { x: -half - off, y: 16 };

    // Secondary side (output): right edge with 4 clearly spaced terminals
    if (term.id === "L1_sec") return { x: half + off, y: -24 };
    if (term.id === "L2_sec") return { x: half + off, y: -8 };
    if (term.id === "L3_sec") return { x: half + off, y: 8 };
    if (term.id === "N_sec") return { x: half + off, y: 24 };
  }

  if (model.terminalLayout === "residential") {
    if (term.phase === "L1" || term.role === "phase") return { x: -half - off, y: 0 };
    if (term.phase === "PE" || term.role === "protective") return { x: 0, y: -half - off };
    if (term.phase === "N" || term.role === "neutral") return { x: 0, y: half + off };
    return { x: half + off, y: 0 };
  }

  // Separate inputs and outputs onto their respective edges so terminals never overlap
  const sameDirTerms = model.terminals.filter((t) => t.direction === term.direction);
  const idx = sameDirTerms.indexOf(term);
  const total = sameDirTerms.length;
  const spread = COMPONENT_SIZE * 0.7;
  const step = total > 1 ? spread / (total - 1) : 0;
  const offsetWithinSide = -spread / 2 + (idx >= 0 ? idx : 0) * step;

  if (term.direction === "in") return { x: -half - off, y: offsetWithinSide };
  if (term.direction === "out") return { x: half + off, y: offsetWithinSide };
  return { x: offsetWithinSide, y: -half - off };
}

/**
 * Absolute terminal position on the canvas, after rotation.
 */
export function getTerminalAbsolutePosition(
  component: ComponentInstance,
  terminalId: string
): Point {
  const model = getComponentModel(component.typeId);
  if (!model) return { x: component.x, y: component.y };
  const local = getTerminalLocalPosition(component.typeId, terminalId);
  if (!local) return { x: component.x, y: component.y };

  const rad = (component.rotation * Math.PI) / 180;
  return {
    x: component.x + local.x * Math.cos(rad) - local.y * Math.sin(rad),
    y: component.y + local.x * Math.sin(rad) + local.y * Math.cos(rad),
  };
}

/**
 * Detects the terminal under a given canvas point, within a hit tolerance.
 * Returns null when nothing is close enough (prevents false connections).
 */
export function findTerminalAtPoint(
  component: ComponentInstance,
  point: Point,
  hitRadius = 12
): string | null {
  const model = getComponentModel(component.typeId);
  if (!model) return null;
  let best: string | null = null;
  let bestDist = hitRadius;
  for (const term of model.terminals) {
    const pos = getTerminalAbsolutePosition(component, term.id);
    const d = Math.hypot(pos.x - point.x, pos.y - point.y);
    if (d <= bestDist) {
      bestDist = d;
      best = term.id;
    }
  }
  return best;
}
