// ============================================================================
// ElectroVoltio - REBT conductor color utilities
// Visual-only helpers. They never affect topology or electrical calculations.
// ============================================================================

import type { CableInstance, ComponentInstance } from "@/types/circuit";
import { getComponentModel } from "@/data/catalog";

export type ConductorKind = "phase" | "neutral" | "protective" | "positive" | "negative" | "unknown";

export const REBT_COLORS = {
  phase: "#8B4513",       // Brown: preferred phase/line colour
  phaseBlack: "#1F2937",  // Alternative line colour
  phaseGrey: "#6B7280",   // Alternative line colour
  neutral: "#6DB7E8",      // Light blue: neutral
  protective: "#2E7D32",  // Green base; SVG adds the yellow stripe
  protectiveYellow: "#F2C94C",
  positive: "#C62828",
  negative: "#1565C0",
  unknown: "#64748B",
} as const;

export const PE_GRADIENT_ID = "rebt-pe-conductor";

function terminalPhase(
  componentId: string,
  terminalId: string,
  components: ComponentInstance[]
) {
  const component = components.find((item) => item.id === componentId);
  if (!component) return undefined;
  return getComponentModel(component.typeId)?.terminals.find((item) => item.id === terminalId);
}

export function getConductorKind(
  cable: CableInstance,
  components: ComponentInstance[]
): ConductorKind {
  const from = terminalPhase(cable.fromComponentId, cable.fromTerminalId, components);
  const to = terminalPhase(cable.toComponentId, cable.toTerminalId, components);
  const terminals = [from, to].filter(Boolean);

  if (terminals.some((item) => item?.phase === "PE" || item?.role === "protective")) return "protective";
  if (terminals.some((item) => item?.phase === "N" || item?.role === "neutral")) return "neutral";
  if (terminals.some((item) => item?.phase === "POS" || item?.role === "positive")) return "positive";
  if (terminals.some((item) => item?.phase === "NEG" || item?.role === "negative")) return "negative";
  if (terminals.some((item) => item?.phase === "L1" || item?.phase === "L2" || item?.phase === "L3" || item?.role === "phase")) return "phase";
  return "unknown";
}

export function getDefaultCableColor(
  cable: CableInstance,
  components: ComponentInstance[]
): string {
  switch (getConductorKind(cable, components)) {
    case "phase": return REBT_COLORS.phase;
    case "neutral": return REBT_COLORS.neutral;
    case "protective": return REBT_COLORS.protective;
    case "positive": return REBT_COLORS.positive;
    case "negative": return REBT_COLORS.negative;
    default: return REBT_COLORS.unknown;
  }
}

export function getCableColor(
  cable: CableInstance,
  components: ComponentInstance[]
): string {
  return cable.visualColor || getDefaultCableColor(cable, components);
}

export function getConductorLabel(kind: ConductorKind): string {
  switch (kind) {
    case "phase": return "Fase / Línea (L)";
    case "neutral": return "Neutro (N)";
    case "protective": return "Protección / Tierra (PE)";
    case "positive": return "Positivo (POS)";
    case "negative": return "Negativo (NEG)";
    default: return "Conductor";
  }
}
