// ============================================================================
// ElectroVoltio - Component Catalog
// All electrical component models with physical parameters
// ============================================================================

import {
  ElectricalComponentModel,
  TerminalDefinition,
  BranchDefinition,
} from "@/engine/types";
import { RESIDENTIAL_CONTROLS } from "@/data/residentialControls";

// --- Helper builders -------------------------------------------------------
function terminal(
  id: string, name: string, phase: TerminalDefinition["phase"],
  role: TerminalDefinition["role"], direction: TerminalDefinition["direction"] = "bidirectional"
): TerminalDefinition {
  return { id, name, phase, role, direction };
}

function branch(
  id: string, from: string, to: string,
  resistance: number, reactance: number = 0,
  phase: TerminalDefinition["phase"] = "L1", enabled: boolean = true
): BranchDefinition {
  return { id, fromTerminal: from, toTerminal: to, resistance, reactance, enabled, phase };
}

// --- Sources ----------------------------------------------------------------

export const SOURCE_SINGLE_PHASE_230V: ElectricalComponentModel = {
  typeId: "source_single_230v",
  name: "Fuente monofásica 230V",
  category: "source",
  terminals: [
    terminal("L", "L", "L1", "phase", "out"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "out"),
  ],
  branches: [
    branch("b_L", "L", "L", 0.001, 0, "L1"),
    branch("b_N", "N", "N", 0.001, 0, "N"),
    branch("b_PE", "PE", "PE", 0.001, 0, "PE"),
  ],
  source: {
    sourceType: "ac_single",
    voltage: 230,
    frequency: 50,
    internalImpedance: { r: 0.01, x: 0.005 },
    phases: ["L1"],
  },
  ratedVoltage: 230,
  normativeReferences: ["IEC 60038"],
};

export const SOURCE_THREE_PHASE_400V: ElectricalComponentModel = {
  typeId: "source_three_400v",
  name: "Fuente trifásica 400V",
  category: "source",
  terminals: [
    terminal("L1", "L1", "L1", "phase", "out"),
    terminal("L2", "L2", "L2", "phase", "out"),
    terminal("L3", "L3", "L3", "phase", "out"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "out"),
  ],
  branches: [
    branch("b_L1", "L1", "L1", 0.001, 0, "L1"),
    branch("b_L2", "L2", "L2", 0.001, 0, "L2"),
    branch("b_L3", "L3", "L3", 0.001, 0, "L3"),
    branch("b_N", "N", "N", 0.001, 0, "N"),
    branch("b_PE", "PE", "PE", 0.001, 0, "PE"),
  ],
  source: {
    sourceType: "ac_three_phase",
    voltage: 230, // L-N voltage
    frequency: 50,
    internalImpedance: { r: 0.01, x: 0.005 },
    phases: ["L1", "L2", "L3"],
    phaseAngles: [0, -2 * Math.PI / 3, -4 * Math.PI / 3],
  },
  ratedVoltage: 400,
  normativeReferences: ["IEC 60038"],
};

export const SOURCE_DC_48V: ElectricalComponentModel = {
  typeId: "source_dc_48v",
  name: "Fuente DC 48V",
  category: "source",
  terminals: [
    terminal("POS", "POS", "POS", "positive", "out"),
    terminal("NEG", "NEG", "NEG", "negative", "out"),
    terminal("PE", "PE", "PE", "protective", "out"),
  ],
  branches: [
    branch("b_POS", "POS", "POS", 0.005, 0, "POS"),
    branch("b_NEG", "NEG", "NEG", 0.005, 0, "NEG"),
    branch("b_PE", "PE", "PE", 0.005, 0, "PE"),
  ],
  source: {
    sourceType: "dc",
    voltage: 48,
    frequency: 0,
    internalImpedance: { r: 0.05, x: 0 },
    phases: ["POS", "NEG"],
  },
  ratedVoltage: 48,
};

// --- Protective Devices: MCB (PIA) -----------------------------------------

function makeMCB(
  typeId: string, name: string,
  ratedCurrent: number, curve: "B" | "C" | "D",
  poles: number, breakingCapacity: number,
  sensitivity?: number
): ElectricalComponentModel {
  const terminals: TerminalDefinition[] = [];
  const branches: BranchDefinition[] = [];

  if (poles >= 1) {
    terminals.push(terminal("L1_in", "L1 (in)", "L1", "phase", "in"));
    terminals.push(terminal("L1_out", "L1 (out)", "L1", "phase", "out"));
    branches.push(branch("b_L1", "L1_in", "L1_out", 0.005, 0.001, "L1"));
  }
  if (poles >= 2 && poles <= 4) {
    // 1P+N, 2P, 3P, 3P+N, 4P
    if (poles === 2) {
      // Could be 1P+N or 2P
      terminals.push(terminal("N_in", "N (in)", "N", "neutral", "in"));
      terminals.push(terminal("N_out", "N (out)", "N", "neutral", "out"));
      branches.push(branch("b_N", "N_in", "N_out", 0.005, 0.001, "N"));
    }
  }
  if (poles >= 3) {
    terminals.push(terminal("L2_in", "L2 (in)", "L2", "phase", "in"));
    terminals.push(terminal("L2_out", "L2 (out)", "L2", "phase", "out"));
    terminals.push(terminal("L3_in", "L3 (in)", "L3", "phase", "in"));
    terminals.push(terminal("L3_out", "L3 (out)", "L3", "phase", "out"));
    branches.push(branch("b_L2", "L2_in", "L2_out", 0.005, 0.001, "L2"));
    branches.push(branch("b_L3", "L3_in", "L3_out", 0.005, 0.001, "L3"));
  }
  if (poles === 4) {
    terminals.push(terminal("N_in", "N (in)", "N", "neutral", "in"));
    terminals.push(terminal("N_out", "N (out)", "N", "neutral", "out"));
    branches.push(branch("b_N", "N_in", "N_out", 0.005, 0.001, "N"));
  }

  // MCB curve data (simplified IEC curves)
  const curveData = getCurveData(curve);

  return {
    typeId,
    name,
    category: "protection",
    terminals,
    branches,
    protection: {
      protectionType: "MCB",
      ratedCurrent,
      curve,
      curveData,
      breakingCapacity,
      poles,
      thermalTrip: 1.45,  // 1.45×In for thermal
      magneticTrip: curve === "B" ? 3 : curve === "C" ? 5 : 10, // multiples of In
    },
    ratedCurrent,
    normativeReferences: ["IEC 60898-1"],
  };
}

function getCurveData(curve: "B" | "C" | "D") {
  // Simplified time-current curves (I/In → time in seconds)
  switch (curve) {
    case "B":
      return [
        { currentMultiple: 1.13, timeSeconds: Infinity },
        { currentMultiple: 1.45, timeSeconds: 3600 },
        { currentMultiple: 2.55, timeSeconds: 60 },
        { currentMultiple: 3, timeSeconds: 0.1 },
        { currentMultiple: 5, timeSeconds: 0.04 },
        { currentMultiple: 10, timeSeconds: 0.01 },
      ];
    case "C":
      return [
        { currentMultiple: 1.13, timeSeconds: Infinity },
        { currentMultiple: 1.45, timeSeconds: 3600 },
        { currentMultiple: 2.55, timeSeconds: 120 },
        { currentMultiple: 5, timeSeconds: 0.1 },
        { currentMultiple: 10, timeSeconds: 0.01 },
      ];
    case "D":
      return [
        { currentMultiple: 1.13, timeSeconds: Infinity },
        { currentMultiple: 1.45, timeSeconds: 3600 },
        { currentMultiple: 2.55, timeSeconds: 200 },
        { currentMultiple: 10, timeSeconds: 0.1 },
        { currentMultiple: 20, timeSeconds: 0.01 },
      ];
  }
}

export const MCB_B_10A_1P = makeMCB("mcb_b_10a_1p", "PIA B 10A 1P", 10, "B", 1, 10);
export const MCB_B_16A_1P = makeMCB("mcb_b_16a_1p", "PIA B 16A 1P", 16, "B", 1, 10);
export const MCB_B_20A_1P = makeMCB("mcb_b_20a_1p", "PIA B 20A 1P", 20, "B", 1, 10);
export const MCB_B_25A_1P = makeMCB("mcb_b_25a_1p", "PIA B 25A 1P", 25, "B", 1, 10);
export const MCB_B_32A_1P = makeMCB("mcb_b_32a_1p", "PIA B 32A 1P", 32, "B", 1, 10);
export const MCB_C_16A_1P = makeMCB("mcb_c_16a_1p", "PIA C 16A 1P", 16, "C", 1, 10);
export const MCB_C_20A_1P = makeMCB("mcb_c_20a_1p", "PIA C 20A 1P", 20, "C", 1, 10);
export const MCB_C_25A_1P = makeMCB("mcb_c_25a_1p", "PIA C 25A 1P", 25, "C", 1, 10);
export const MCB_C_32A_1P = makeMCB("mcb_c_32a_1p", "PIA C 32A 1P", 32, "C", 1, 10);
export const MCB_C_40A_1P = makeMCB("mcb_c_40a_1p", "PIA C 40A 1P", 40, "C", 1, 10);
export const MCB_D_16A_1P = makeMCB("mcb_d_16a_1p", "PIA D 16A 1P", 16, "D", 1, 10);
export const MCB_D_20A_1P = makeMCB("mcb_d_20a_1p", "PIA D 20A 1P", 20, "D", 1, 10);
export const MCB_D_32A_1P = makeMCB("mcb_d_32a_1p", "PIA D 32A 1P", 32, "D", 1, 10);
export const MCB_C_16A_2P = makeMCB("mcb_c_16a_2p", "PIA C 16A 1P+N", 16, "C", 2, 10);
export const MCB_C_20A_2P = makeMCB("mcb_c_20a_2p", "PIA C 20A 1P+N", 20, "C", 2, 10);
export const MCB_C_32A_2P = makeMCB("mcb_c_32a_2p", "PIA C 32A 1P+N", 32, "C", 2, 10);
export const MCB_C_16A_3P = makeMCB("mcb_c_16a_3p", "PIA C 16A 3P", 16, "C", 3, 15);
export const MCB_C_20A_3P = makeMCB("mcb_c_20a_3p", "PIA C 20A 3P", 20, "C", 3, 15);
export const MCB_C_32A_3P = makeMCB("mcb_c_32a_3p", "PIA C 32A 3P", 32, "C", 3, 15);
export const MCB_C_40A_3P = makeMCB("mcb_c_40a_3p", "PIA C 40A 3P", 40, "C", 3, 15);

// --- RCD (Diferencial) -----------------------------------------------------

function makeRCD(
  typeId: string, name: string,
  sensitivity: number, behavior: "AC" | "A" | "F" | "B" | "S" | "SUPERIMMUNE" | "RESETTABLE",
  poles: number, ratedCurrent?: number
): ElectricalComponentModel {
  const terminals: TerminalDefinition[] = [];
  const branches: BranchDefinition[] = [];

  // RCD measures current through all phase + neutral conductors via toroidal
  if (poles >= 2) {
    terminals.push(terminal("L1_in", "L1 (in)", "L1", "phase", "in"));
    terminals.push(terminal("L1_out", "L1 (out)", "L1", "phase", "out"));
    terminals.push(terminal("N_in", "N (in)", "N", "neutral", "in"));
    terminals.push(terminal("N_out", "N (out)", "N", "neutral", "out"));
    branches.push(branch("b_L1", "L1_in", "L1_out", 0.003, 0.001, "L1"));
    branches.push(branch("b_N", "N_in", "N_out", 0.003, 0.001, "N"));
  }
  if (poles >= 4) {
    terminals.push(terminal("L2_in", "L2 (in)", "L2", "phase", "in"));
    terminals.push(terminal("L2_out", "L2 (out)", "L2", "phase", "out"));
    terminals.push(terminal("L3_in", "L3 (in)", "L3", "phase", "in"));
    terminals.push(terminal("L3_out", "L3 (out)", "L3", "phase", "out"));
    branches.push(branch("b_L2", "L2_in", "L2_out", 0.003, 0.001, "L2"));
    branches.push(branch("b_L3", "L3_in", "L3_out", 0.003, 0.001, "L3"));
  }

  return {
    typeId,
    name,
    category: "protection",
    terminals,
    branches,
    protection: {
      protectionType: "RCD",
      sensitivity, // mA
      rcdBehavior: behavior,
      poles,
      ratedCurrent,
    },
    ratedCurrent,
    normativeReferences: ["IEC 61008-1", "IEC 61009-1"],
  };
}

export const RCD_AC_30mA_2P = makeRCD("rcd_ac_30ma_2p", "Diferencial AC 30mA 2P", 30, "AC", 2, 40);
export const RCD_A_30mA_2P = makeRCD("rcd_a_30ma_2p", "Diferencial A 30mA 2P", 30, "A", 2, 40);
export const RCD_F_30mA_2P = makeRCD("rcd_f_30ma_2p", "Diferencial F 30mA 2P", 30, "F", 2, 40);
export const RCD_B_30mA_2P = makeRCD("rcd_b_30ma_2p", "Diferencial B 30mA 2P", 30, "B", 2, 40);
export const RCD_S_300mA_2P = makeRCD("rcd_s_300ma_2p", "Diferencial S 300mA 2P", 300, "S", 2, 40);
export const RCD_AC_30mA_4P = makeRCD("rcd_ac_30ma_4p", "Diferencial AC 30mA 4P", 30, "AC", 4, 40);
export const RCD_A_30mA_4P = makeRCD("rcd_a_30ma_4p", "Diferencial A 30mA 4P", 30, "A", 4, 40);
export const RCD_B_30mA_4P = makeRCD("rcd_b_30ma_4p", "Diferencial B 30mA 4P", 30, "B", 4, 40);
export const RCD_SUPER_30mA_2P = makeRCD("rcd_super_30ma_2p", "Superinmunizado 30mA 2P", 30, "SUPERIMMUNE", 2, 40);
export const RCD_RESET_30mA_2P = makeRCD("rcd_reset_30ma_2p", "Rearmable 30mA 2P", 30, "RESETTABLE", 2, 40);

// --- IGA (General Switch) --------------------------------------------------

export const IGA_40A_2P: ElectricalComponentModel = {
  typeId: "iga_40a_2p",
  name: "IGA 40A 2P",
  category: "protection",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.002, 0.001, "L1"),
    branch("b_N", "N_in", "N_out", 0.002, 0.001, "N"),
  ],
  protection: {
    protectionType: "IGA",
    ratedCurrent: 40,
    poles: 2,
    breakingCapacity: 10,
  },
  ratedCurrent: 40,
  normativeReferences: ["REBT ITC-BT-25"],
};

export const IGA_63A_4P: ElectricalComponentModel = {
  typeId: "iga_63a_4p",
  name: "IGA 63A 4P",
  category: "protection",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("L2_in", "L2 (in)", "L2", "phase", "in"),
    terminal("L2_out", "L2 (out)", "L2", "phase", "out"),
    terminal("L3_in", "L3 (in)", "L3", "phase", "in"),
    terminal("L3_out", "L3 (out)", "L3", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.002, 0.001, "L1"),
    branch("b_L2", "L2_in", "L2_out", 0.002, 0.001, "L2"),
    branch("b_L3", "L3_in", "L3_out", 0.002, 0.001, "L3"),
    branch("b_N", "N_in", "N_out", 0.002, 0.001, "N"),
  ],
  protection: {
    protectionType: "IGA",
    ratedCurrent: 63,
    poles: 4,
    breakingCapacity: 10,
  },
  ratedCurrent: 63,
  normativeReferences: ["REBT ITC-BT-25"],
};

// --- ICP (Limiting Switch) -------------------------------------------------

export const ICP_40A_2P: ElectricalComponentModel = {
  typeId: "icp_40a_2p",
  name: "ICP 40A 2P",
  category: "protection",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.001, 0.001, "L1"),
    branch("b_N", "N_in", "N_out", 0.001, 0.001, "N"),
  ],
  protection: {
    protectionType: "ICP",
    ratedCurrent: 40,
    poles: 2,
    breakingCapacity: 6,
  },
  ratedCurrent: 40,
  normativeReferences: ["REBT ITC-BT-11"],
};

// --- MCCB (Interruptor automático de caja moldeada) -------------------------

export const MCCB_100A_3P: ElectricalComponentModel = {
  typeId: "mccb_100a_3p",
  name: "MCCB 100A 3P",
  category: "protection",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("L2_in", "L2 (in)", "L2", "phase", "in"),
    terminal("L2_out", "L2 (out)", "L2", "phase", "out"),
    terminal("L3_in", "L3 (in)", "L3", "phase", "in"),
    terminal("L3_out", "L3 (out)", "L3", "phase", "out"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.001, 0.002, "L1"),
    branch("b_L2", "L2_in", "L2_out", 0.001, 0.002, "L2"),
    branch("b_L3", "L3_in", "L3_out", 0.001, 0.002, "L3"),
  ],
  protection: {
    protectionType: "MCCB",
    ratedCurrent: 100,
    curve: "C",
    curveData: getCurveData("C"),
    breakingCapacity: 25,
    poles: 3,
    thermalTrip: 1.3,
    magneticTrip: 10,
  },
  ratedCurrent: 100,
  normativeReferences: ["IEC 60947-2"],
};

// --- ACB (Interruptor de caja abierta) --------------------------------------

export const ACB_400A_3P: ElectricalComponentModel = {
  typeId: "acb_400a_3p",
  name: "ACB 400A 3P",
  category: "protection",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("L2_in", "L2 (in)", "L2", "phase", "in"),
    terminal("L2_out", "L2 (out)", "L2", "phase", "out"),
    terminal("L3_in", "L3 (in)", "L3", "phase", "in"),
    terminal("L3_out", "L3 (out)", "L3", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.0005, 0.001, "L1"),
    branch("b_L2", "L2_in", "L2_out", 0.0005, 0.001, "L2"),
    branch("b_L3", "L3_in", "L3_out", 0.0005, 0.001, "L3"),
    branch("b_N", "N_in", "N_out", 0.0005, 0.001, "N"),
  ],
  protection: {
    protectionType: "ACB",
    ratedCurrent: 400,
    breakingCapacity: 65,
    poles: 4,
    thermalTrip: 1.2,
    magneticTrip: 8,
    groundFaultTrip: 30,
  },
  ratedCurrent: 400,
  normativeReferences: ["IEC 60947-2"],
};

// --- Fuses -----------------------------------------------------------------

function makeFuse(
  typeId: string, name: string,
  ratedCurrent: number, fuseType: "gG" | "aM" | "gPV",
  breakingCapacity: number
): ElectricalComponentModel {
  return {
    typeId,
    name,
    category: "protection",
    terminals: [
      terminal("L_in", "L (in)", "L1", "phase", "in"),
      terminal("L_out", "L (out)", "L1", "phase", "out"),
    ],
    branches: [
      branch("b_fuse", "L_in", "L_out", 0.01, 0.001, "L1"),
    ],
    protection: {
      protectionType: "FUSE",
      ratedCurrent,
      fuseType,
      breakingCapacity,
      poles: 1,
      i2tRating: ratedCurrent * ratedCurrent * 10, // simplified
    },
    ratedCurrent,
    normativeReferences: ["IEC 60269"],
  };
}

export const FUSE_GG_16A = makeFuse("fuse_gg_16a", "Fusible gG 16A", 16, "gG", 50);
export const FUSE_GG_25A = makeFuse("fuse_gg_25a", "Fusible gG 25A", 25, "gG", 50);
export const FUSE_GG_32A = makeFuse("fuse_gg_32a", "Fusible gG 32A", 32, "gG", 50);
export const FUSE_GG_63A = makeFuse("fuse_gg_63a", "Fusible gG 63A", 63, "gG", 50);
export const FUSE_AM_10A = makeFuse("fuse_am_10a", "Fusible aM 10A", 10, "aM", 80);
export const FUSE_GPV_15A = makeFuse("fuse_gpv_15a", "Fusible gPV 15A", 15, "gPV", 30);

// --- SPD (Surge Protection Device) -----------------------------------------

export const SPD_T2_2P: ElectricalComponentModel = {
  typeId: "spd_t2_2p",
  name: "SPD Tipo 2 2P",
  category: "protection",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("L_out", "L (out)", "L1", "phase", "out"),
    terminal("PE", "PE", "PE", "protective", "bidirectional"),
  ],
  branches: [
    branch("b_pass", "L_in", "L_out", 0.001, 0, "L1"),
    // Varistor path to PE - normally open, activates on overvoltage
    branch("b_var", "L_in", "PE", 1e6, 0, "L1", false),
  ],
  protection: {
    protectionType: "SPD",
    poles: 1,
    voltageMax: 275,
    uc: 275,
    up: 1.3,
    inSPD: 10,
    imax: 40,
  },
  ratedVoltage: 230,
  normativeReferences: ["IEC 61643-11"],
};

// --- Sectionalizer (Seccionador) -------------------------------------------

export const SECTIONALIZER_2P: ElectricalComponentModel = {
  typeId: "sectionalizer_2p",
  name: "Seccionador 2P",
  category: "protection",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.001, 0.0005, "L1"),
    branch("b_N", "N_in", "N_out", 0.001, 0.0005, "N"),
  ],
  protection: {
    protectionType: "SECTIONALIZER",
    poles: 2,
  },
};

// --- Distribution (Cuadro) -------------------------------------------------

export const DISTRIBUTION_BOARD_6WAY: ElectricalComponentModel = {
  typeId: "dist_board_6way",
  name: "Cuadro 6 circuitos",
  category: "distribution",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("PE_in", "PE (in)", "PE", "protective", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("L2_out", "L2 (out)", "L1", "phase", "out"),
    terminal("L3_out", "L3 (out)", "L1", "phase", "out"),
    terminal("L4_out", "L4 (out)", "L1", "phase", "out"),
    terminal("L5_out", "L5 (out)", "L1", "phase", "out"),
    terminal("L6_out", "L6 (out)", "L1", "phase", "out"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
    terminal("PE_out", "PE (out)", "PE", "protective", "out"),
  ],
  branches: [
    branch("b_L1", "L_in", "L1_out", 0.0001, 0, "L1"),
    branch("b_L2", "L_in", "L2_out", 0.0001, 0, "L1"),
    branch("b_L3", "L_in", "L3_out", 0.0001, 0, "L1"),
    branch("b_L4", "L_in", "L4_out", 0.0001, 0, "L1"),
    branch("b_L5", "L_in", "L5_out", 0.0001, 0, "L1"),
    branch("b_L6", "L_in", "L6_out", 0.0001, 0, "L1"),
    branch("b_N", "N_in", "N_out", 0.0001, 0, "N"),
    branch("b_PE", "PE_in", "PE_out", 0.0001, 0, "PE"),
  ],
};

// --- Loads ------------------------------------------------------------------

export const LOAD_RESISTIVE_2300W: ElectricalComponentModel = {
  typeId: "load_resistive_2300w",
  name: "Carga resistiva 2300W",
  category: "load",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_load", "L", "N", 23.0, 0, "L1"), // R = V²/P = 230²/2300 = 23Ω
  ],
  load: {
    type: "resistive",
    ratedPower: 2300,
    ratedVoltage: 230,
    resistance: 23.0,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
};

export const LOAD_RESISTIVE_1000W: ElectricalComponentModel = {
  typeId: "load_resistive_1000w",
  name: "Carga resistiva 1000W",
  category: "load",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_load", "L", "N", 52.9, 0, "L1"), // R = 230²/1000 = 52.9Ω
  ],
  load: {
    type: "resistive",
    ratedPower: 1000,
    ratedVoltage: 230,
    resistance: 52.9,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
};

export const LOAD_INDUCTIVE_MOTOR_3KW: ElectricalComponentModel = {
  typeId: "load_motor_3kw",
  name: "Motor 3kW",
  category: "load",
  terminals: [
    terminal("L1", "L1", "L1", "phase", "in"),
    terminal("L2", "L2", "L2", "phase", "in"),
    terminal("L3", "L3", "L3", "phase", "in"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_L1", "L1", "PE", 17.6, 5.0, "L1"),
    branch("b_L2", "L2", "PE", 17.6, 5.0, "L2"),
    branch("b_L3", "L3", "PE", 17.6, 5.0, "L3"),
  ],
  load: {
    type: "inductive",
    ratedPower: 3000,
    ratedVoltage: 400,
    powerFactor: 0.85,
    efficiency: 0.9,
    phases: ["L1", "L2", "L3"],
    needsNeutral: false,
  },
  ratedVoltage: 400,
};

export const LOAD_RESISTIVE_500W: ElectricalComponentModel = {
  typeId: "load_resistive_500w",
  name: "Carga resistiva 500W",
  category: "load",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_load", "L", "N", 105.8, 0, "L1"), // R = 230²/500 = 105.8Ω
  ],
  load: {
    type: "resistive",
    ratedPower: 500,
    ratedVoltage: 230,
    resistance: 105.8,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
};

export const LOAD_CAPACITIVE_800W: ElectricalComponentModel = {
  typeId: "load_cap_800w",
  name: "Carga capacitiva 800W",
  category: "load",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_load", "L", "N", 58.5, -15.0, "L1"),
  ],
  load: {
    type: "capacitive",
    ratedPower: 800,
    ratedVoltage: 230,
    powerFactor: 0.97,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
};

// --- Transformer ------------------------------------------------------------

export const TRANSFORMER_230_400_5KVA: ElectricalComponentModel = {
  typeId: "transformer_230_400_5kva",
  name: "Transformador 230/400V 5kVA",
  category: "distribution",
  terminals: [
    terminal("L1_pri", "L1 (primario)", "L1", "phase", "in"),
    terminal("N_pri", "N (primario)", "N", "neutral", "in"),
    terminal("L1_sec", "L1 (secundario)", "L1", "phase", "out"),
    terminal("L2_sec", "L2 (secundario)", "L2", "phase", "out"),
    terminal("L3_sec", "L3 (secundario)", "L3", "phase", "out"),
    terminal("N_sec", "N (secundario)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_pri", "L1_pri", "N_pri", 0.5, 0.3, "L1"),
    branch("b_sec_L1", "L1_sec", "N_sec", 0.15, 0.1, "L1"),
    branch("b_sec_L2", "L2_sec", "N_sec", 0.15, 0.1, "L2"),
    branch("b_sec_L3", "L3_sec", "N_sec", 0.15, 0.1, "L3"),
  ],
  transformer: {
    turnsRatio: 400 / 230,
    impedance: { r: 0.5, x: 0.3 },
    ratedPower: 5000,
    primaryPhases: ["L1"],
    secondaryPhases: ["L1", "L2", "L3"],
  },
  ratedVoltage: 400,
};

// --- Instruments ------------------------------------------------------------

export const VOLTMETER: ElectricalComponentModel = {
  typeId: "voltmeter",
  name: "Voltímetro Digital",
  category: "instrument",
  terminals: [
    terminal("A", "V+ (L)", "L1", "phase", "in"),
    terminal("B", "V- (N)", "N", "neutral", "in"),
  ],
  branches: [
    branch("b_meter", "A", "B", 1e7, 0, "L1"), // High impedance (10 MΩ)
  ],
  normativeReferences: ["IEC 61010-1", "IEC 61557"],
};

export const AMMETER: ElectricalComponentModel = {
  typeId: "ammeter",
  name: "Amperímetro Digital",
  category: "instrument",
  terminals: [
    terminal("L_in", "I (in)", "L1", "phase", "in"),
    terminal("L_out", "I (out)", "L1", "phase", "out"),
  ],
  branches: [
    branch("b_meter", "L_in", "L_out", 0.0005, 0, "L1"), // In-series pass-through (0.5 mΩ)
  ],
  normativeReferences: ["IEC 61010-1"],
};

export const WATTMETER: ElectricalComponentModel = {
  typeId: "wattmeter",
  name: "Vatímetro Digital (W/kW)",
  category: "instrument",
  terminals: [
    terminal("L_in", "I (in)", "L1", "phase", "in"),
    terminal("L_out", "I (out)", "L1", "phase", "out"),
    terminal("N", "N (ref)", "N", "neutral", "in"),
  ],
  branches: [
    branch("b_current", "L_in", "L_out", 0.0005, 0, "L1"), // Current coil (0.5 mΩ)
    branch("b_voltage", "L_in", "N", 1e7, 0, "L1"),        // Voltage shunt (10 MΩ)
  ],
  normativeReferences: ["IEC 60688"],
};

export const VARMETER: ElectricalComponentModel = {
  typeId: "varmeter",
  name: "Varímetro (VAR/kVAR)",
  category: "instrument",
  terminals: [
    terminal("L_in", "I (in)", "L1", "phase", "in"),
    terminal("L_out", "I (out)", "L1", "phase", "out"),
    terminal("N", "N (ref)", "N", "neutral", "in"),
  ],
  branches: [
    branch("b_current", "L_in", "L_out", 0.0005, 0, "L1"),
    branch("b_voltage", "L_in", "N", 1e7, 0, "L1"),
  ],
  normativeReferences: ["IEC 60688"],
};

export const FREQUENCYMETER: ElectricalComponentModel = {
  typeId: "frequencymeter",
  name: "Frecuencímetro (Hz)",
  category: "instrument",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("N", "N", "N", "neutral", "in"),
  ],
  branches: [
    branch("b_meter", "L", "N", 1e7, 0, "L1"),
  ],
  normativeReferences: ["IEC 60051"],
};

export const ENERGY_METER: ElectricalComponentModel = {
  typeId: "energy_meter",
  name: "Contador de Energía (kWh)",
  category: "instrument",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("L_out", "L (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L", "L_in", "L_out", 0.0005, 0, "L1"),
    branch("b_N", "N_in", "N_out", 0.0005, 0, "N"),
    branch("b_shunt", "L_in", "N_in", 1e7, 0, "L1"),
  ],
  ratedCurrent: 63,
  normativeReferences: ["IEC 62053-21", "MID Clase B"],
};

export const NETWORK_ANALYZER_1P: ElectricalComponentModel = {
  typeId: "network_analyzer_1p",
  name: "Analizador de Redes 1F",
  category: "instrument",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("L_out", "L (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_L", "L_in", "L_out", 0.0005, 0, "L1"),
    branch("b_N", "N_in", "N_out", 0.0005, 0, "N"),
    branch("b_pe", "PE", "PE", 1e7, 0, "PE"),
  ],
  ratedCurrent: 63,
  normativeReferences: ["IEC 61557-12"],
};

export const NETWORK_ANALYZER_3P: ElectricalComponentModel = {
  typeId: "network_analyzer_3p",
  name: "Analizador de Redes 3F",
  category: "instrument",
  terminals: [
    terminal("L1_in", "L1 (in)", "L1", "phase", "in"),
    terminal("L1_out", "L1 (out)", "L1", "phase", "out"),
    terminal("L2_in", "L2 (in)", "L2", "phase", "in"),
    terminal("L2_out", "L2 (out)", "L2", "phase", "out"),
    terminal("L3_in", "L3 (in)", "L3", "phase", "in"),
    terminal("L3_out", "L3 (out)", "L3", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_L1", "L1_in", "L1_out", 0.0005, 0, "L1"),
    branch("b_L2", "L2_in", "L2_out", 0.0005, 0, "L2"),
    branch("b_L3", "L3_in", "L3_out", 0.0005, 0, "L3"),
    branch("b_N", "N_in", "N_out", 0.0005, 0, "N"),
  ],
  ratedCurrent: 125,
  normativeReferences: ["IEC 61557-12", "IEC 61000-4-30"],
};

export const CLAMP_METER: ElectricalComponentModel = {
  typeId: "clamp_meter",
  name: "Pinza Amperimétrica",
  category: "instrument",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("L_out", "L (out)", "L1", "phase", "out"),
  ],
  branches: [
    branch("b_clamp", "L_in", "L_out", 0.0002, 0, "L1"),
  ],
  normativeReferences: ["IEC 61010-2-032"],
};

export const EARTH_TESTER: ElectricalComponentModel = {
  typeId: "earth_tester",
  name: "Telurómetro / Medidor Tierra",
  category: "instrument",
  terminals: [
    terminal("L", "Fase (L)", "L1", "phase", "in"),
    terminal("PE", "Tierra (PE)", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_test", "L", "PE", 1e6, 0, "L1"),
  ],
  normativeReferences: ["IEC 61557-5", "REBT ITC-BT-18"],
};

export const OSCILLOSCOPE: ElectricalComponentModel = {
  typeId: "oscilloscope",
  name: "Osciloscopio / Monitor",
  category: "instrument",
  terminals: [
    terminal("CH1", "CH1 (L)", "L1", "phase", "in"),
    terminal("CH2", "CH2 (N)", "N", "neutral", "in"),
    terminal("GND", "GND (PE)", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_ch1", "CH1", "GND", 1e7, 0, "L1"),
    branch("b_ch2", "CH2", "GND", 1e7, 0, "N"),
  ],
  normativeReferences: ["IEC 61010-1"],
};

// --- Photovoltaic -----------------------------------------------------------

export const PV_PANEL_400W: ElectricalComponentModel = {
  typeId: "pv_panel_400w",
  name: "Panel FV 400W",
  category: "photovoltaic",
  terminals: [
    terminal("POS", "POS", "POS", "positive", "out"),
    terminal("NEG", "NEG", "NEG", "negative", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_panel", "NEG", "POS", 0.5, 0, "POS"),
  ],
  source: {
    sourceType: "dc",
    voltage: 40,   // Vmp
    frequency: 0,
    internalImpedance: { r: 0.5, x: 0 },
    phases: ["POS", "NEG"],
  },
  ratedVoltage: 40,
  ratedCurrent: 10,
};

export const DC_MCB_16A: ElectricalComponentModel = {
  typeId: "dcmcb_16a",
  name: "MCB DC 16A",
  category: "protection",
  terminals: [
    terminal("POS_in", "POS (in)", "POS", "positive", "in"),
    terminal("POS_out", "POS (out)", "POS", "positive", "out"),
    terminal("NEG_in", "NEG (in)", "NEG", "negative", "in"),
    terminal("NEG_out", "NEG (out)", "NEG", "negative", "out"),
  ],
  branches: [
    branch("b_pos", "POS_in", "POS_out", 0.005, 0, "POS"),
    branch("b_neg", "NEG_in", "NEG_out", 0.005, 0, "NEG"),
  ],
  protection: {
    protectionType: "MCB",
    ratedCurrent: 16,
    curve: "C",
    curveData: getCurveData("C"),
    breakingCapacity: 10,
    poles: 2,
    thermalTrip: 1.45,
    magneticTrip: 5,
  },
  ratedCurrent: 16,
};

// --- EV Charging ------------------------------------------------------------

export const EV_CHARGER_7KW: ElectricalComponentModel = {
  typeId: "ev_charger_7kw",
  name: "Cargador VE 7.4kW",
  category: "ev_charging",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("N", "N", "N", "neutral", "in"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_load", "L", "N", 7.15, 1.2, "L1"),
  ],
  load: {
    type: "impedance",
    ratedPower: 7400,
    ratedVoltage: 230,
    impedance: { r: 7.15, x: 1.2 },
    powerFactor: 0.99,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
  ratedCurrent: 32,
};

// --- AFDD ------------------------------------------------------------------

export const AFDD_16A: ElectricalComponentModel = {
  typeId: "afdd_16a",
  name: "AFDD 16A",
  category: "protection",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("L_out", "L (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "bidirectional"),
  ],
  branches: [
    branch("b_L", "L_in", "L_out", 0.005, 0.001, "L1"),
    branch("b_N", "N_in", "N_out", 0.005, 0.001, "N"),
  ],
  protection: {
    protectionType: "AFDD",
    ratedCurrent: 16,
    curve: "C",
    poles: 1,
    arcSensitivity: "medium",
  },
  ratedCurrent: 16,
};

// ============================================================================
// RESIDENTIAL COMPONENTS (Vivienda)
// ============================================================================

// --- Helper: single-phase appliance with PE and "residential" terminal layout --

function residentialAppliance(
  typeId: string,
  name: string,
  ratedPower: number,
  ratedCurrent: number,
  powerFactor = 1,
  reactance = 0,
  resistance = 100000
): ElectricalComponentModel {
  return {
    typeId,
    name,
    category: "residential",
    terminalLayout: "residential",
    terminals: [
      terminal("L", "L", "L1", "phase", "in"),
      terminal("PE", "PE", "PE", "protective", "in"),
      terminal("N", "N", "N", "neutral", "out"),
    ],
    branches: [branch("b_load", "L", "N", resistance, reactance, "L1")],
    load: {
      type: ratedPower > 0 ? "resistive" : "resistive",
      ratedPower,
      ratedVoltage: 230,
      resistance,
      powerFactor,
      phases: ["L1"],
      needsNeutral: true,
    },
    ratedVoltage: 230,
    ratedCurrent,
  };
}

// --- Helper for single-phase loads ------------------------------------------

function makeResidentialLoad(
  typeId: string, name: string, power: number,
  type: "resistive" | "inductive" | "impedance" | "constant_power",
  reactance: number = 0,
  powerFactor: number = 1,
  ratedCurrent?: number
): ElectricalComponentModel {
  const R = power > 0 ? (230 * 230) / power : 10000;
  return {
    typeId,
    name,
    category: "residential",
    terminalLayout: "residential",
    terminals: [
      terminal("L", "L", "L1", "phase", "in"),
      terminal("PE", "PE", "PE", "protective", "in"),
      terminal("N", "N", "N", "neutral", "out"),
    ],
    branches: [
      branch("b_load", "L", "N", R, reactance, "L1"),
    ],
    load: {
      type,
      ratedPower: power,
      ratedVoltage: 230,
      resistance: R,
      powerFactor,
      phases: ["L1"],
      needsNeutral: true,
    },
    ratedVoltage: 230,
    ratedCurrent: ratedCurrent || Math.ceil(power / 230),
  };
}

// --- Lighting ---------------------------------------------------------------

export const LOAD_LIGHT_LED_12W = makeResidentialLoad(
  "load_light_led_12w", "Lámpara LED 12W", 12, "resistive"
);
export const LOAD_LIGHT_LED_20W = makeResidentialLoad(
  "load_light_led_20w", "Lámpara LED 20W", 20, "resistive"
);
export const LOAD_LIGHT_FLUORESCENT_36W = makeResidentialLoad(
  "load_light_fluorescent_36w", "Fluorescente 36W", 36, "inductive", 2.5, 0.9
);
export const LOAD_LIGHT_INCANDESCENT_100W = makeResidentialLoad(
  "load_light_100w", "Bombilla 100W", 100, "resistive"
);

// --- Power outlets (Enchufes) -----------------------------------------------

export const LOAD_OUTLET_16A: ElectricalComponentModel = {
  typeId: "load_outlet_16a",
  name: "Enchufe 16A",
  category: "residential",
  terminalLayout: "residential",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("PE", "PE", "PE", "protective", "in"),
    terminal("N", "N", "N", "neutral", "out"),
  ],
  branches: [branch("b_load", "L", "N", 100000, 0, "L1")],
  load: {
    type: "resistive",
    ratedPower: 0,
    ratedVoltage: 230,
    resistance: 100000,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
  ratedCurrent: 16,
  normativeReferences: ["IEC 60083", "UNE-EN 50075"],
};

export const LOAD_OUTLET_SCHUKO: ElectricalComponentModel = {
  typeId: "load_outlet_schuko",
  name: "Enchufe Schuko 16A",
  category: "residential",
  terminalLayout: "residential",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("PE", "PE", "PE", "protective", "in"),
    terminal("N", "N", "N", "neutral", "out"),
  ],
  branches: [branch("b_load", "L", "N", 100000, 0, "L1")],
  load: {
    type: "resistive",
    ratedPower: 0,
    ratedVoltage: 230,
    resistance: 100000,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
  ratedCurrent: 16,
  normativeReferences: ["IEC 60083", "CEE 7/4"],
};

export const LOAD_OUTLET_32A: ElectricalComponentModel = {
  typeId: "load_outlet_32a",
  name: "Enchufe 32A (cocina/horno)",
  category: "residential",
  terminalLayout: "residential",
  terminals: [
    terminal("L", "L", "L1", "phase", "in"),
    terminal("PE", "PE", "PE", "protective", "in"),
    terminal("N", "N", "N", "neutral", "out"),
  ],
  branches: [branch("b_load", "L", "N", 100000, 0, "L1")],
  load: {
    type: "resistive",
    ratedPower: 0,
    ratedVoltage: 230,
    resistance: 100000,
    phases: ["L1"],
    needsNeutral: true,
  },
  ratedVoltage: 230,
  ratedCurrent: 32,
};

// --- Domestic Appliances (Electrodomésticos) --------------------------------

export const LOAD_BOILER_1500W = makeResidentialLoad(
  "load_boiler_1500w", "Termo eléctrico 1500W", 1500, "resistive", 0, 1, 10
);
export const LOAD_BOILER_2000W = makeResidentialLoad(
  "load_boiler_2000w", "Termo eléctrico 2000W", 2000, "resistive", 0, 1, 10
);
export const LOAD_BOILER_3000W = makeResidentialLoad(
  "load_boiler_3000w", "Termo eléctrico 3000W", 3000, "resistive", 0, 1, 16
);

export const LOAD_OVEN_2000W = makeResidentialLoad(
  "load_oven_2000w", "Horno eléctrico 2000W", 2000, "resistive", 0, 1, 10
);
export const LOAD_OVEN_3000W = makeResidentialLoad(
  "load_oven_3000w", "Horno eléctrico 3000W", 3000, "resistive", 0, 1, 16
);

export const LOAD_INDUCTION_HOB_3600W = makeResidentialLoad(
  "load_induction_hob_3600w", "Placa inducción 3.6kW", 3600, "inductive", 1.5, 0.98, 16
);
export const LOAD_INDUCTION_HOB_7200W: ElectricalComponentModel = {
  typeId: "load_induction_hob_7200w",
  name: "Placa inducción 7.2kW (trifásica)",
  category: "residential",
  terminals: [
    terminal("L1", "L1", "L1", "phase", "in"),
    terminal("L2", "L2", "L2", "phase", "in"),
    terminal("L3", "L3", "L3", "phase", "in"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "in"),
  ],
  branches: [
    branch("b_L1", "L1", "N", 22.1, 1.0, "L1"),
    branch("b_L2", "L2", "N", 22.1, 1.0, "L2"),
    branch("b_L3", "L3", "N", 22.1, 1.0, "L3"),
  ],
  load: {
    type: "inductive",
    ratedPower: 7200,
    ratedVoltage: 400,
    powerFactor: 0.98,
    phases: ["L1", "L2", "L3"],
    needsNeutral: true,
  },
  ratedVoltage: 400,
  ratedCurrent: 16,
};

export const LOAD_WASHING_2200W = makeResidentialLoad(
  "load_washing_machine_2200w", "Lavadora 2200W", 2200, "inductive", 2.0, 0.85, 10
);
export const LOAD_DRYER_2500W = makeResidentialLoad(
  "load_dryer_2500w", "Secadora 2500W", 2500, "inductive", 2.5, 0.85, 16
);
export const LOAD_DISHWASHER_2000W = makeResidentialLoad(
  "load_dishwasher_2000w", "Lavavajillas 2000W", 2000, "inductive", 1.8, 0.85, 10
);
export const LOAD_FRIDGE_150W = makeResidentialLoad(
  "load_fridge_150w", "Frigorífico 150W", 150, "inductive", 5.0, 0.7, 2
);
export const LOAD_FRIDGE_300W = makeResidentialLoad(
  "load_fridge_300w", "Frigorífico congelador 300W", 300, "inductive", 4.0, 0.75, 2
);

export const LOAD_AC_2500W = makeResidentialLoad(
  "load_ac_2500w", "Aire acondicionado 2.5kW", 2500, "inductive", 3.0, 0.85, 16
);
export const LOAD_AC_3500W = makeResidentialLoad(
  "load_ac_3500w", "Aire acondicionado 3.5kW", 3500, "inductive", 2.5, 0.85, 16
);
export const LOAD_AC_5000W = makeResidentialLoad(
  "load_ac_5000w", "Aire acondicionado 5kW", 5000, "inductive", 2.0, 0.85, 25
);

export const LOAD_RADIATOR_1000W = makeResidentialLoad(
  "load_radiator_1000w", "Radiador eléctrico 1000W", 1000, "resistive", 0, 1, 5
);
export const LOAD_RADIATOR_2000W = makeResidentialLoad(
  "load_radiator_2000w", "Radiador eléctrico 2000W", 2000, "resistive", 0, 1, 10
);

export const LOAD_IRON_2200W = makeResidentialLoad(
  "load_iron_2200w", "Plancha 2200W", 2200, "resistive", 0, 1, 10
);
export const LOAD_HAIRDRIER_2000W = makeResidentialLoad(
  "load_hairdrier_2000w", "Secador de pelo 2000W", 2000, "resistive", 0, 1, 10
);
export const LOAD_VACUUM_1500W = makeResidentialLoad(
  "load_vacuum_1500w", "Aspiradora 1500W", 1500, "inductive", 2.0, 0.8, 7
);

export const LOAD_TV_150W = makeResidentialLoad(
  "load_tv_150w", "Televisor 150W", 150, "resistive", 0, 0.95, 2
);
export const LOAD_COMPUTER_300W = makeResidentialLoad(
  "load_computer_300w", "Ordenador 300W", 300, "resistive", 0, 0.9, 2
);
export const LOAD_MICROWAVE_1200W = makeResidentialLoad(
  "load_microwave_1200w", "Microondas 1200W", 1200, "resistive", 0, 1, 6
);

export const LOAD_EXHAUST_FAN_60W = makeResidentialLoad(
  "load_exhaust_fan_60w", "Extractor baño 60W", 60, "inductive", 8.0, 0.6, 1
);
export const LOAD_EXHAUST_FAN_120W = makeResidentialLoad(
  "load_exhaust_fan_120w", "Extractor cocina 120W", 120, "inductive", 5.0, 0.7, 1
);

// --- Special residential devices --------------------------------------------

// Doorbell, smoke detector and programmable timer are defined in residentialControls.ts

// --- Photovoltaic residential (3-phase inverter) ----------------------------

export const PV_INVERTER_5KW: ElectricalComponentModel = {
  typeId: "pv_inverter_5kw",
  name: "Inversor FV 5kW",
  category: "photovoltaic",
  terminals: [
    terminal("POS", "DC+", "POS", "positive", "in"),
    terminal("NEG", "DC-", "NEG", "negative", "in"),
    terminal("L", "L", "L1", "phase", "out"),
    terminal("N", "N", "N", "neutral", "out"),
    terminal("PE", "PE", "PE", "protective", "out"),
  ],
  branches: [
    branch("b_dc", "NEG", "POS", 1000, 0, "POS"),
    branch("b_ac", "L", "N", 0.1, 0.05, "L1"),
  ],
  source: {
    sourceType: "ac_single",
    voltage: 230,
    frequency: 50,
    internalImpedance: { r: 0.1, x: 0.05 },
    phases: ["L1"],
  },
  ratedVoltage: 230,
  ratedCurrent: 22,
};

// --- Additional protection for residential ----------------------------------

export const RCD_AC_30mA_2P_S = makeRCD("rcd_ac_30ma_2p_s", "Diferencial AC 30mA tipo S (selectivo)", 30, "S", 2, 40);

// --- Distribution boards for residential ------------------------------------

export const DISTRIBUTION_BOARD_12WAY: ElectricalComponentModel = {
  typeId: "dist_board_12way",
  name: "Cuadro 12 circuitos",
  category: "distribution",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("PE_in", "PE (in)", "PE", "protective", "in"),
    terminal("L1_out", "C1", "L1", "phase", "out"),
    terminal("L2_out", "C2", "L1", "phase", "out"),
    terminal("L3_out", "C3", "L1", "phase", "out"),
    terminal("L4_out", "C4", "L1", "phase", "out"),
    terminal("L5_out", "C5", "L1", "phase", "out"),
    terminal("L6_out", "C6", "L1", "phase", "out"),
    terminal("L7_out", "C7", "L1", "phase", "out"),
    terminal("L8_out", "C8", "L1", "phase", "out"),
    terminal("L9_out", "C9", "L1", "phase", "out"),
    terminal("L10_out", "C10", "L1", "phase", "out"),
    terminal("L11_out", "C11", "L1", "phase", "out"),
    terminal("L12_out", "C12", "L1", "phase", "out"),
    terminal("N_out", "N", "N", "neutral", "out"),
    terminal("PE_out", "PE", "PE", "protective", "out"),
  ],
  branches: [
    branch("b_L1", "L_in", "L1_out", 0.0001, 0, "L1"),
    branch("b_L2", "L_in", "L2_out", 0.0001, 0, "L1"),
    branch("b_L3", "L_in", "L3_out", 0.0001, 0, "L1"),
    branch("b_L4", "L_in", "L4_out", 0.0001, 0, "L1"),
    branch("b_L5", "L_in", "L5_out", 0.0001, 0, "L1"),
    branch("b_L6", "L_in", "L6_out", 0.0001, 0, "L1"),
    branch("b_L7", "L_in", "L7_out", 0.0001, 0, "L1"),
    branch("b_L8", "L_in", "L8_out", 0.0001, 0, "L1"),
    branch("b_L9", "L_in", "L9_out", 0.0001, 0, "L1"),
    branch("b_L10", "L_in", "L10_out", 0.0001, 0, "L1"),
    branch("b_L11", "L_in", "L11_out", 0.0001, 0, "L1"),
    branch("b_L12", "L_in", "L12_out", 0.0001, 0, "L1"),
    branch("b_N", "N_in", "N_out", 0.0001, 0, "N"),
    branch("b_PE", "PE_in", "PE_out", 0.0001, 0, "PE"),
  ],
};

// --- Voltage Relay ----------------------------------------------------------

export const VOLTAGE_RELAY_2P: ElectricalComponentModel = {
  typeId: "voltage_relay_2p",
  name: "Relé de tensión 2P",
  category: "protection",
  terminals: [
    terminal("L_in", "L (in)", "L1", "phase", "in"),
    terminal("L_out", "L (out)", "L1", "phase", "out"),
    terminal("N_in", "N (in)", "N", "neutral", "in"),
    terminal("N_out", "N (out)", "N", "neutral", "out"),
  ],
  branches: [
    branch("b_L", "L_in", "L_out", 0.002, 0.001, "L1"),
    branch("b_N", "N_in", "N_out", 0.002, 0.001, "N"),
  ],
  protection: {
    protectionType: "RELAY_VOLTAGE",
    poles: 2,
    voltageMin: 195,
    voltageMax: 253,
    overvoltageSetpoint: 253,
    undervoltageSetpoint: 195,
  },
  ratedVoltage: 230,
};

// --- Complete Catalog -------------------------------------------------------

export const CATALOG: ElectricalComponentModel[] = [
  // Sources
  SOURCE_SINGLE_PHASE_230V,
  SOURCE_THREE_PHASE_400V,
  SOURCE_DC_48V,
  // MCBs
  MCB_B_10A_1P, MCB_B_16A_1P, MCB_B_20A_1P, MCB_B_25A_1P, MCB_B_32A_1P,
  MCB_C_16A_1P, MCB_C_20A_1P, MCB_C_25A_1P, MCB_C_32A_1P, MCB_C_40A_1P,
  MCB_D_16A_1P, MCB_D_20A_1P, MCB_D_32A_1P,
  MCB_C_16A_2P, MCB_C_20A_2P, MCB_C_32A_2P,
  MCB_C_16A_3P, MCB_C_20A_3P, MCB_C_32A_3P, MCB_C_40A_3P,
  // RCDs
  RCD_AC_30mA_2P, RCD_A_30mA_2P, RCD_F_30mA_2P, RCD_B_30mA_2P,
  RCD_S_300mA_2P, RCD_AC_30mA_4P, RCD_A_30mA_4P, RCD_B_30mA_4P,
  RCD_SUPER_30mA_2P, RCD_RESET_30mA_2P,
  // IGA, ICP
  IGA_40A_2P, IGA_63A_4P, ICP_40A_2P,
  // MCCB, ACB
  MCCB_100A_3P, ACB_400A_3P,
  // Fuses
  FUSE_GG_16A, FUSE_GG_25A, FUSE_GG_32A, FUSE_GG_63A, FUSE_AM_10A, FUSE_GPV_15A,
  // SPD
  SPD_T2_2P,
  // Sectionalizer
  SECTIONALIZER_2P,
  // Distribution
  DISTRIBUTION_BOARD_6WAY,
  // Loads (generic)
  LOAD_RESISTIVE_500W, LOAD_RESISTIVE_1000W, LOAD_RESISTIVE_2300W,
  LOAD_INDUCTIVE_MOTOR_3KW, LOAD_CAPACITIVE_800W,
  // Residential loads
  LOAD_LIGHT_LED_12W, LOAD_LIGHT_LED_20W, LOAD_LIGHT_FLUORESCENT_36W, LOAD_LIGHT_INCANDESCENT_100W,
  LOAD_OUTLET_16A, LOAD_OUTLET_SCHUKO, LOAD_OUTLET_32A,
  LOAD_BOILER_1500W, LOAD_BOILER_2000W, LOAD_BOILER_3000W,
  LOAD_OVEN_2000W, LOAD_OVEN_3000W,
  LOAD_INDUCTION_HOB_3600W, LOAD_INDUCTION_HOB_7200W,
  LOAD_WASHING_2200W, LOAD_DRYER_2500W, LOAD_DISHWASHER_2000W,
  LOAD_FRIDGE_150W, LOAD_FRIDGE_300W,
  LOAD_AC_2500W, LOAD_AC_3500W, LOAD_AC_5000W,
  LOAD_RADIATOR_1000W, LOAD_RADIATOR_2000W,
  LOAD_IRON_2200W, LOAD_HAIRDRIER_2000W, LOAD_VACUUM_1500W,
  LOAD_TV_150W, LOAD_COMPUTER_300W, LOAD_MICROWAVE_1200W,
  LOAD_EXHAUST_FAN_60W, LOAD_EXHAUST_FAN_120W,
  ...RESIDENTIAL_CONTROLS,
  // Residential protection & distribution
  RCD_AC_30mA_2P_S,
  DISTRIBUTION_BOARD_12WAY,
  // Photovoltaic residential
  PV_INVERTER_5KW,
  // Transformer
  TRANSFORMER_230_400_5KVA,
  // Instruments
  VOLTMETER, AMMETER, WATTMETER, VARMETER, FREQUENCYMETER,
  ENERGY_METER, NETWORK_ANALYZER_1P, NETWORK_ANALYZER_3P,
  CLAMP_METER, EARTH_TESTER, OSCILLOSCOPE,
  // PV
  PV_PANEL_400W, DC_MCB_16A,
  // EV
  EV_CHARGER_7KW,
  // AFDD
  AFDD_16A,
  // Voltage relay
  VOLTAGE_RELAY_2P,
];

export function getComponentModel(typeId: string): ElectricalComponentModel | undefined {
  return CATALOG.find(c => c.typeId === typeId);
}

// --- Catalog grouped by category -------------------------------------------

export const CATALOG_BY_CATEGORY: Record<string, ElectricalComponentModel[]> = {};
for (const item of CATALOG) {
  if (!CATALOG_BY_CATEGORY[item.category]) {
    CATALOG_BY_CATEGORY[item.category] = [];
  }
  CATALOG_BY_CATEGORY[item.category].push(item);
}

export const CATEGORY_LABELS: Record<string, string> = {
  source: "Fuentes",
  distribution: "Distribución",
  protection: "Protecciones",
  load: "Cargas",
  passive: "Pasivos",
  instrument: "Instrumentación",
  photovoltaic: "Fotovoltaica",
  ev_charging: "Vehículo eléctrico",
  industrial: "Industrial",
  residential: "Vivienda",
  semiconductor: "Semiconductores",
};
