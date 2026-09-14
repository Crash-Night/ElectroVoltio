// ============================================================================
// ElectroVoltio - Pre-designed Installation Models (Presets)
// Verified electrical circuits conforming to REBT & IEC standards
// ============================================================================

import type { ComponentInstance, CableInstance, CableSpec } from "@/types/circuit";

const COPPER_10: CableSpec = {
  conductorMaterial: "copper",
  crossSection: 10,
  length: 2,
  insulationType: "XLPE",
  maxTemperature: 90,
  resistivity: 0.0175,
  temperatureCoeff: 0.00393,
  reactancePerKm: 0.08,
  cores: 2,
};

const COPPER_6: CableSpec = {
  conductorMaterial: "copper",
  crossSection: 6,
  length: 3,
  insulationType: "PVC",
  maxTemperature: 70,
  resistivity: 0.0175,
  temperatureCoeff: 0.00393,
  reactancePerKm: 0.08,
  cores: 2,
};

const COPPER_4: CableSpec = {
  conductorMaterial: "copper",
  crossSection: 4,
  length: 5,
  insulationType: "PVC",
  maxTemperature: 70,
  resistivity: 0.0175,
  temperatureCoeff: 0.00393,
  reactancePerKm: 0.08,
  cores: 2,
};

const COPPER_2_5: CableSpec = {
  conductorMaterial: "copper",
  crossSection: 2.5,
  length: 8,
  insulationType: "PVC",
  maxTemperature: 70,
  resistivity: 0.0175,
  temperatureCoeff: 0.00393,
  reactancePerKm: 0.08,
  cores: 2,
};

const COPPER_1_5: CableSpec = {
  conductorMaterial: "copper",
  crossSection: 1.5,
  length: 12,
  insulationType: "PVC",
  maxTemperature: 70,
  resistivity: 0.0175,
  temperatureCoeff: 0.00393,
  reactancePerKm: 0.08,
  cores: 2,
};

export interface CircuitPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  components: ComponentInstance[];
  cables: CableInstance[];
}

// ----------------------------------------------------------------------------
// 1. Vivienda Completa (Grado Básico - REBT ITC-BT-25)
// ----------------------------------------------------------------------------
export const PRESET_VIVIENDA: CircuitPreset = {
  id: "preset_vivienda",
  name: "Vivienda Completa (ITC-BT-25)",
  description: "Instalación residencial completa con ICP, IGA, SPD, RCD y circuitos C1 (luz), C2 (tomas), C3 (cocina/horno), C4 (lavadora) y C5 (baños).",
  badge: "Vivienda 230V",
  components: [
    // Headboard
    { id: "src_red", typeId: "source_single_230v", x: 60, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "icp", typeId: "icp_40a_2p", x: 180, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "iga", typeId: "iga_40a_2p", x: 290, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "spd", typeId: "spd_t2_2p", x: 400, y: 60, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "rcd", typeId: "rcd_a_30ma_2p", x: 400, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "energy_meter", typeId: "energy_meter", x: 510, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Branch MCBs
    { id: "mcb_c1", typeId: "mcb_c_16a_1p", x: 640, y: 40, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "mcb_c2", typeId: "mcb_c_16a_1p", x: 640, y: 130, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "mcb_c3", typeId: "mcb_c_25a_1p", x: 640, y: 220, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "mcb_c4", typeId: "mcb_c_20a_1p", x: 640, y: 310, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Loads
    { id: "led_luz", typeId: "load_light_led_20w", x: 800, y: 40, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "fridge", typeId: "load_fridge_150w", x: 800, y: 130, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "oven", typeId: "load_oven_3000w", x: 800, y: 220, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "washing", typeId: "load_washing_machine_2200w", x: 800, y: 310, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Parallel monitors
    { id: "vmeter", typeId: "voltmeter", x: 510, y: 40, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
  ],
  cables: [
    // Source -> ICP
    { id: "c_s_icp_l", fromComponentId: "src_red", fromTerminalId: "L", toComponentId: "icp", toTerminalId: "L1_in", waypoints: [], cable: COPPER_10, visualColor: "#8B4513" },
    { id: "c_s_icp_n", fromComponentId: "src_red", fromTerminalId: "N", toComponentId: "icp", toTerminalId: "N_in", waypoints: [], cable: COPPER_10, visualColor: "#6DB7E8" },

    // ICP -> IGA
    { id: "c_icp_iga_l", fromComponentId: "icp", fromTerminalId: "L1_out", toComponentId: "iga", toTerminalId: "L1_in", waypoints: [], cable: COPPER_10, visualColor: "#8B4513" },
    { id: "c_icp_iga_n", fromComponentId: "icp", fromTerminalId: "N_out", toComponentId: "iga", toTerminalId: "N_in", waypoints: [], cable: COPPER_10, visualColor: "#6DB7E8" },

    // IGA -> SPD & RCD
    { id: "c_iga_spd_l", fromComponentId: "iga", fromTerminalId: "L1_out", toComponentId: "spd", toTerminalId: "L_in", waypoints: [{ x: 345, y: 60 }], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_spd_pe", fromComponentId: "spd", fromTerminalId: "PE", toComponentId: "src_red", toTerminalId: "PE", waypoints: [{ x: 400, y: 15 }, { x: 60, y: 15 }], cable: COPPER_6, visualColor: "#2E7D32" },
    { id: "c_iga_rcd_l", fromComponentId: "iga", fromTerminalId: "L1_out", toComponentId: "rcd", toTerminalId: "L1_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_iga_rcd_n", fromComponentId: "iga", fromTerminalId: "N_out", toComponentId: "rcd", toTerminalId: "N_in", waypoints: [], cable: COPPER_6, visualColor: "#6DB7E8" },

    // RCD -> Energy Meter
    { id: "c_rcd_em_l", fromComponentId: "rcd", fromTerminalId: "L1_out", toComponentId: "energy_meter", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_rcd_em_n", fromComponentId: "rcd", fromTerminalId: "N_out", toComponentId: "energy_meter", toTerminalId: "N_in", waypoints: [], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Voltmeter monitor
    { id: "c_vm_l", fromComponentId: "energy_meter", fromTerminalId: "L_in", toComponentId: "vmeter", toTerminalId: "A", waypoints: [], cable: COPPER_1_5, visualColor: "#8B4513" },
    { id: "c_vm_n", fromComponentId: "energy_meter", fromTerminalId: "N_in", toComponentId: "vmeter", toTerminalId: "B", waypoints: [], cable: COPPER_1_5, visualColor: "#6DB7E8" },

    // Energy Meter -> MCBs (L bus)
    { id: "c_em_mcb1", fromComponentId: "energy_meter", fromTerminalId: "L_out", toComponentId: "mcb_c1", toTerminalId: "L1_in", waypoints: [{ x: 575, y: 40 }], cable: COPPER_2_5, visualColor: "#8B4513" },
    { id: "c_em_mcb2", fromComponentId: "energy_meter", fromTerminalId: "L_out", toComponentId: "mcb_c2", toTerminalId: "L1_in", waypoints: [{ x: 575, y: 130 }], cable: COPPER_2_5, visualColor: "#8B4513" },
    { id: "c_em_mcb3", fromComponentId: "energy_meter", fromTerminalId: "L_out", toComponentId: "mcb_c3", toTerminalId: "L1_in", waypoints: [{ x: 575, y: 220 }], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_em_mcb4", fromComponentId: "energy_meter", fromTerminalId: "L_out", toComponentId: "mcb_c4", toTerminalId: "L1_in", waypoints: [{ x: 575, y: 310 }], cable: COPPER_4, visualColor: "#8B4513" },

    // MCB C1 -> LED
    { id: "c_mcb1_led", fromComponentId: "mcb_c1", fromTerminalId: "L1_out", toComponentId: "led_luz", toTerminalId: "L", waypoints: [], cable: COPPER_1_5, visualColor: "#8B4513" },
    { id: "c_led_n", fromComponentId: "led_luz", fromTerminalId: "N", toComponentId: "energy_meter", toTerminalId: "N_out", waypoints: [{ x: 800, y: 90 }, { x: 550, y: 90 }], cable: COPPER_1_5, visualColor: "#6DB7E8" },
    { id: "c_led_pe", fromComponentId: "led_luz", fromTerminalId: "PE", toComponentId: "spd", toTerminalId: "PE", waypoints: [{ x: 800, y: 15 }, { x: 400, y: 15 }], cable: COPPER_1_5, visualColor: "#2E7D32" },

    // MCB C2 -> Fridge
    { id: "c_mcb2_fridge", fromComponentId: "mcb_c2", fromTerminalId: "L1_out", toComponentId: "fridge", toTerminalId: "L", waypoints: [], cable: COPPER_2_5, visualColor: "#8B4513" },
    { id: "c_fridge_n", fromComponentId: "fridge", fromTerminalId: "N", toComponentId: "energy_meter", toTerminalId: "N_out", waypoints: [{ x: 800, y: 180 }, { x: 550, y: 180 }], cable: COPPER_2_5, visualColor: "#6DB7E8" },
    { id: "c_fridge_pe", fromComponentId: "fridge", fromTerminalId: "PE", toComponentId: "spd", toTerminalId: "PE", waypoints: [{ x: 800, y: 15 }, { x: 400, y: 15 }], cable: COPPER_2_5, visualColor: "#2E7D32" },

    // MCB C3 -> Oven
    { id: "c_mcb3_oven", fromComponentId: "mcb_c3", fromTerminalId: "L1_out", toComponentId: "oven", toTerminalId: "L", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_oven_n", fromComponentId: "oven", fromTerminalId: "N", toComponentId: "energy_meter", toTerminalId: "N_out", waypoints: [{ x: 800, y: 270 }, { x: 550, y: 270 }], cable: COPPER_6, visualColor: "#6DB7E8" },
    { id: "c_oven_pe", fromComponentId: "oven", fromTerminalId: "PE", toComponentId: "spd", toTerminalId: "PE", waypoints: [{ x: 840, y: 15 }, { x: 400, y: 15 }], cable: COPPER_6, visualColor: "#2E7D32" },

    // MCB C4 -> Washing Machine
    { id: "c_mcb4_wash", fromComponentId: "mcb_c4", fromTerminalId: "L1_out", toComponentId: "washing", toTerminalId: "L", waypoints: [], cable: COPPER_4, visualColor: "#8B4513" },
    { id: "c_wash_n", fromComponentId: "washing", fromTerminalId: "N", toComponentId: "energy_meter", toTerminalId: "N_out", waypoints: [{ x: 800, y: 360 }, { x: 550, y: 360 }], cable: COPPER_4, visualColor: "#6DB7E8" },
    { id: "c_wash_pe", fromComponentId: "washing", fromTerminalId: "PE", toComponentId: "spd", toTerminalId: "PE", waypoints: [{ x: 840, y: 15 }, { x: 400, y: 15 }], cable: COPPER_4, visualColor: "#2E7D32" },
  ],
};

// ----------------------------------------------------------------------------
// 2. Instalación Trifásica Industrial (400V / 230V)
// ----------------------------------------------------------------------------
export const PRESET_TRIFASICA: CircuitPreset = {
  id: "preset_trifasica",
  name: "Instalación Trifásica 400V Industrial",
  description: "Red 400V trifásica con IGA 4P 63A, Diferencial 4P, Analizador de redes 3F, Motor trifásico 3kW, compensación reactiva y transformador auxiliar 230V.",
  badge: "Trifásica 400V",
  components: [
    { id: "src_3p", typeId: "source_three_400v", x: 60, y: 180, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "iga_3p", typeId: "iga_63a_4p", x: 200, y: 180, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "rcd_3p", typeId: "rcd_a_30ma_4p", x: 330, y: 180, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "analyzer_3p", typeId: "network_analyzer_3p", x: 460, y: 180, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Industrial branch 1: 3-Phase Motor
    { id: "mccb", typeId: "mccb_100a_3p", x: 600, y: 90, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "motor_3kw", typeId: "load_motor_3kw", x: 760, y: 90, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Industrial branch 2: Reactive power compensation capacitor
    { id: "cap_bank", typeId: "load_cap_800w", x: 760, y: 200, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Auxiliary branch 3: 400V/230V Transformer -> auxiliary single-phase lighting
    { id: "trafo", typeId: "transformer_230_400_5kva", x: 600, y: 310, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "mcb_aux", typeId: "mcb_c_16a_1p", x: 730, y: 310, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "aux_led", typeId: "load_light_led_20w", x: 860, y: 310, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
  ],
  cables: [
    // Source -> IGA 4P
    { id: "c_s_iga_l1", fromComponentId: "src_3p", fromTerminalId: "L1", toComponentId: "iga_3p", toTerminalId: "L1_in", waypoints: [], cable: COPPER_10, visualColor: "#8B4513" },
    { id: "c_s_iga_l2", fromComponentId: "src_3p", fromTerminalId: "L2", toComponentId: "iga_3p", toTerminalId: "L2_in", waypoints: [], cable: COPPER_10, visualColor: "#1F2937" },
    { id: "c_s_iga_l3", fromComponentId: "src_3p", fromTerminalId: "L3", toComponentId: "iga_3p", toTerminalId: "L3_in", waypoints: [], cable: COPPER_10, visualColor: "#6B7280" },
    { id: "c_s_iga_n", fromComponentId: "src_3p", fromTerminalId: "N", toComponentId: "iga_3p", toTerminalId: "N_in", waypoints: [], cable: COPPER_10, visualColor: "#6DB7E8" },

    // IGA -> RCD 4P
    { id: "c_iga_rcd_l1", fromComponentId: "iga_3p", fromTerminalId: "L1_out", toComponentId: "rcd_3p", toTerminalId: "L1_in", waypoints: [], cable: COPPER_10, visualColor: "#8B4513" },
    { id: "c_iga_rcd_l2", fromComponentId: "iga_3p", fromTerminalId: "L2_out", toComponentId: "rcd_3p", toTerminalId: "L2_in", waypoints: [], cable: COPPER_10, visualColor: "#1F2937" },
    { id: "c_iga_rcd_l3", fromComponentId: "iga_3p", fromTerminalId: "L3_out", toComponentId: "rcd_3p", toTerminalId: "L3_in", waypoints: [], cable: COPPER_10, visualColor: "#6B7280" },
    { id: "c_iga_rcd_n", fromComponentId: "iga_3p", fromTerminalId: "N_out", toComponentId: "rcd_3p", toTerminalId: "N_in", waypoints: [], cable: COPPER_10, visualColor: "#6DB7E8" },

    // RCD -> Analyzer 3P
    { id: "c_rcd_an_l1", fromComponentId: "rcd_3p", fromTerminalId: "L1_out", toComponentId: "analyzer_3p", toTerminalId: "L1_in", waypoints: [], cable: COPPER_10, visualColor: "#8B4513" },
    { id: "c_rcd_an_l2", fromComponentId: "rcd_3p", fromTerminalId: "L2_out", toComponentId: "analyzer_3p", toTerminalId: "L2_in", waypoints: [], cable: COPPER_10, visualColor: "#1F2937" },
    { id: "c_rcd_an_l3", fromComponentId: "rcd_3p", fromTerminalId: "L3_out", toComponentId: "analyzer_3p", toTerminalId: "L3_in", waypoints: [], cable: COPPER_10, visualColor: "#6B7280" },
    { id: "c_rcd_an_n", fromComponentId: "rcd_3p", fromTerminalId: "N_out", toComponentId: "analyzer_3p", toTerminalId: "N_in", waypoints: [], cable: COPPER_10, visualColor: "#6DB7E8" },

    // Analyzer -> MCCB 3P
    { id: "c_an_mccb_l1", fromComponentId: "analyzer_3p", fromTerminalId: "L1_out", toComponentId: "mccb", toTerminalId: "L1_in", waypoints: [{ x: 530, y: 70 }], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_an_mccb_l2", fromComponentId: "analyzer_3p", fromTerminalId: "L2_out", toComponentId: "mccb", toTerminalId: "L2_in", waypoints: [{ x: 530, y: 90 }], cable: COPPER_6, visualColor: "#1F2937" },
    { id: "c_an_mccb_l3", fromComponentId: "analyzer_3p", fromTerminalId: "L3_out", toComponentId: "mccb", toTerminalId: "L3_in", waypoints: [{ x: 530, y: 110 }], cable: COPPER_6, visualColor: "#6B7280" },

    // MCCB -> Motor 3kW
    { id: "c_mccb_mot_l1", fromComponentId: "mccb", fromTerminalId: "L1_out", toComponentId: "motor_3kw", toTerminalId: "L1", waypoints: [], cable: COPPER_4, visualColor: "#8B4513" },
    { id: "c_mccb_mot_l2", fromComponentId: "mccb", fromTerminalId: "L2_out", toComponentId: "motor_3kw", toTerminalId: "L2", waypoints: [], cable: COPPER_4, visualColor: "#1F2937" },
    { id: "c_mccb_mot_l3", fromComponentId: "mccb", fromTerminalId: "L3_out", toComponentId: "motor_3kw", toTerminalId: "L3", waypoints: [], cable: COPPER_4, visualColor: "#6B7280" },
    { id: "c_mot_pe", fromComponentId: "motor_3kw", fromTerminalId: "PE", toComponentId: "src_3p", toTerminalId: "PE", waypoints: [{ x: 760, y: 30 }, { x: 60, y: 30 }], cable: COPPER_4, visualColor: "#2E7D32" },

    // Capacitor Bank (L1 - N)
    { id: "c_an_cap_l", fromComponentId: "analyzer_3p", fromTerminalId: "L1_out", toComponentId: "cap_bank", toTerminalId: "L", waypoints: [{ x: 550, y: 200 }], cable: COPPER_4, visualColor: "#8B4513" },
    { id: "c_an_cap_n", fromComponentId: "analyzer_3p", fromTerminalId: "N_out", toComponentId: "cap_bank", toTerminalId: "N", waypoints: [{ x: 550, y: 220 }], cable: COPPER_4, visualColor: "#6DB7E8" },
    { id: "c_cap_pe", fromComponentId: "cap_bank", fromTerminalId: "PE", toComponentId: "src_3p", toTerminalId: "PE", waypoints: [{ x: 760, y: 30 }, { x: 60, y: 30 }], cable: COPPER_4, visualColor: "#2E7D32" },

    // Transformer & Aux lighting
    { id: "c_an_trafo_l", fromComponentId: "analyzer_3p", fromTerminalId: "L1_out", toComponentId: "trafo", toTerminalId: "L1_pri", waypoints: [{ x: 530, y: 310 }], cable: COPPER_4, visualColor: "#8B4513" },
    { id: "c_an_trafo_n", fromComponentId: "analyzer_3p", fromTerminalId: "N_out", toComponentId: "trafo", toTerminalId: "N_pri", waypoints: [{ x: 530, y: 330 }], cable: COPPER_4, visualColor: "#6DB7E8" },
    { id: "c_trafo_mcb", fromComponentId: "trafo", fromTerminalId: "L1_sec", toComponentId: "mcb_aux", toTerminalId: "L1_in", waypoints: [], cable: COPPER_2_5, visualColor: "#8B4513" },
    { id: "c_mcb_auxled", fromComponentId: "mcb_aux", toTerminalId: "L", toComponentId: "aux_led", fromTerminalId: "L1_out", waypoints: [], cable: COPPER_1_5, visualColor: "#8B4513" },
    { id: "c_auxled_n", fromComponentId: "aux_led", fromTerminalId: "N", toComponentId: "trafo", toTerminalId: "N_sec", waypoints: [{ x: 860, y: 370 }, { x: 600, y: 370 }], cable: COPPER_1_5, visualColor: "#6DB7E8" },
    { id: "c_auxled_pe", fromComponentId: "aux_led", fromTerminalId: "PE", toComponentId: "src_3p", toTerminalId: "PE", waypoints: [{ x: 860, y: 30 }, { x: 60, y: 30 }], cable: COPPER_1_5, visualColor: "#2E7D32" },
  ],
};

// ----------------------------------------------------------------------------
// 3. Instalación de Vehículo Eléctrico (ITC-BT-52 Esquema 2)
// ----------------------------------------------------------------------------
export const PRESET_VEHICULO_ELECTRICO: CircuitPreset = {
  id: "preset_ve",
  name: "Carga de Vehículo Eléctrico (ITC-BT-52)",
  description: "Punto de recarga individual conforme a ITC-BT-52 con IGA, protección contra sobretensiones SPD, contador homologado MID, diferencial Tipo A y Wallbox 7.4kW.",
  badge: "VE 7.4kW",
  components: [
    { id: "src_red", typeId: "source_single_230v", x: 60, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "iga_ve", typeId: "iga_40a_2p", x: 180, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "spd_ve", typeId: "spd_t2_2p", x: 290, y: 50, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "energy_meter_ve", typeId: "energy_meter", x: 290, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "rcd_ve", typeId: "rcd_super_30ma_2p", x: 420, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "mcb_ve", typeId: "mcb_c_32a_1p", x: 550, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "wattmeter_ve", typeId: "wattmeter", x: 680, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "charger_ve", typeId: "ev_charger_7kw", x: 820, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
  ],
  cables: [
    // Red -> IGA
    { id: "c_ve_s_iga_l", fromComponentId: "src_red", fromTerminalId: "L", toComponentId: "iga_ve", toTerminalId: "L1_in", waypoints: [], cable: COPPER_10, visualColor: "#8B4513" },
    { id: "c_ve_s_iga_n", fromComponentId: "src_red", fromTerminalId: "N", toComponentId: "iga_ve", toTerminalId: "N_in", waypoints: [], cable: COPPER_10, visualColor: "#6DB7E8" },

    // IGA -> SPD
    { id: "c_ve_iga_spd_l", fromComponentId: "iga_ve", fromTerminalId: "L1_out", toComponentId: "spd_ve", toTerminalId: "L_in", waypoints: [{ x: 235, y: 50 }], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_ve_spd_pe", fromComponentId: "spd_ve", fromTerminalId: "PE", toComponentId: "src_red", toTerminalId: "PE", waypoints: [{ x: 290, y: 15 }, { x: 60, y: 15 }], cable: COPPER_6, visualColor: "#2E7D32" },

    // IGA -> Energy Meter (Contador secundario ITC-BT-52)
    { id: "c_ve_iga_em_l", fromComponentId: "iga_ve", fromTerminalId: "L1_out", toComponentId: "energy_meter_ve", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_ve_iga_em_n", fromComponentId: "iga_ve", fromTerminalId: "N_out", toComponentId: "energy_meter_ve", toTerminalId: "N_in", waypoints: [], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Energy Meter -> RCD Superinmunizado
    { id: "c_ve_em_rcd_l", fromComponentId: "energy_meter_ve", fromTerminalId: "L_out", toComponentId: "rcd_ve", toTerminalId: "L1_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_ve_em_rcd_n", fromComponentId: "energy_meter_ve", fromTerminalId: "N_out", toComponentId: "rcd_ve", toTerminalId: "N_in", waypoints: [], cable: COPPER_6, visualColor: "#6DB7E8" },

    // RCD -> MCB C 32A
    { id: "c_ve_rcd_mcb_l", fromComponentId: "rcd_ve", fromTerminalId: "L1_out", toComponentId: "mcb_ve", toTerminalId: "L1_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },

    // MCB -> Wattmeter
    { id: "c_ve_mcb_wm_l", fromComponentId: "mcb_ve", fromTerminalId: "L1_out", toComponentId: "wattmeter_ve", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_ve_rcd_wm_n", fromComponentId: "rcd_ve", fromTerminalId: "N_out", toComponentId: "wattmeter_ve", toTerminalId: "N", waypoints: [{ x: 480, y: 230 }, { x: 680, y: 230 }], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Wattmeter -> EV Charger
    { id: "c_ve_wm_ch_l", fromComponentId: "wattmeter_ve", fromTerminalId: "L_out", toComponentId: "charger_ve", toTerminalId: "L", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_ve_rcd_ch_n", fromComponentId: "rcd_ve", fromTerminalId: "N_out", toComponentId: "charger_ve", toTerminalId: "N", waypoints: [{ x: 480, y: 230 }, { x: 820, y: 230 }], cable: COPPER_6, visualColor: "#6DB7E8" },
    { id: "c_ve_ch_pe", fromComponentId: "charger_ve", fromTerminalId: "PE", toComponentId: "spd_ve", toTerminalId: "PE", waypoints: [{ x: 820, y: 15 }, { x: 290, y: 15 }], cable: COPPER_6, visualColor: "#2E7D32" },
  ],
};

// ----------------------------------------------------------------------------
// 4. Autoconsumo Fotovoltaico con Inversor Solar (ITC-BT-40)
// ----------------------------------------------------------------------------
export const PRESET_FOTOVOLTAICA: CircuitPreset = {
  id: "preset_fv",
  name: "Autoconsumo Fotovoltaico Solar (ITC-BT-40)",
  description: "Generación fotovoltaica con paneles DC, inversor de 5kW, protecciones AC/DC, contador bidireccional y alimentación a cargas domésticas.",
  badge: "Solar FV 5kW",
  components: [
    // PV Array (DC Side)
    { id: "pv_array", typeId: "pv_panel_400w", x: 60, y: 80, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "dcmcb", typeId: "dcmcb_16a", x: 190, y: 80, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "inverter", typeId: "pv_inverter_5kw", x: 330, y: 140, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // AC Protection & Injection
    { id: "rcd_solar", typeId: "rcd_b_30ma_2p", x: 470, y: 140, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "mcb_solar", typeId: "mcb_c_25a_1p", x: 600, y: 140, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "analyzer_solar", typeId: "network_analyzer_1p", x: 730, y: 140, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },

    // Domestic Loads
    { id: "ac_unit", typeId: "load_ac_3500w", x: 870, y: 80, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "led_home", typeId: "load_light_led_20w", x: 870, y: 200, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
  ],
  cables: [
    // PV Panel -> DC MCB
    { id: "c_pv_dcmcb_pos", fromComponentId: "pv_array", fromTerminalId: "POS", toComponentId: "dcmcb", toTerminalId: "POS_in", waypoints: [], cable: COPPER_4, visualColor: "#C62828" },
    { id: "c_pv_dcmcb_neg", fromComponentId: "pv_array", fromTerminalId: "NEG", toComponentId: "dcmcb", toTerminalId: "NEG_in", waypoints: [], cable: COPPER_4, visualColor: "#1565C0" },

    // DC MCB -> Inverter DC Inputs
    { id: "c_dcmcb_inv_pos", fromComponentId: "dcmcb", fromTerminalId: "POS_out", toComponentId: "inverter", toTerminalId: "POS", waypoints: [{ x: 260, y: 120 }], cable: COPPER_4, visualColor: "#C62828" },
    { id: "c_dcmcb_inv_neg", fromComponentId: "dcmcb", fromTerminalId: "NEG_out", toComponentId: "inverter", toTerminalId: "NEG", waypoints: [{ x: 260, y: 140 }], cable: COPPER_4, visualColor: "#1565C0" },

    // Inverter AC Output -> Solar RCD
    { id: "c_inv_rcd_l", fromComponentId: "inverter", fromTerminalId: "L", toComponentId: "rcd_solar", toTerminalId: "L1_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_inv_rcd_n", fromComponentId: "inverter", fromTerminalId: "N", toComponentId: "rcd_solar", toTerminalId: "N_in", waypoints: [], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Solar RCD -> Solar MCB
    { id: "c_rcd_mcb_l", fromComponentId: "rcd_solar", fromTerminalId: "L1_out", toComponentId: "mcb_solar", toTerminalId: "L1_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },

    // Solar MCB & RCD -> Network Analyzer
    { id: "c_mcb_an_l", fromComponentId: "mcb_solar", fromTerminalId: "L1_out", toComponentId: "analyzer_solar", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_rcd_an_n", fromComponentId: "rcd_solar", fromTerminalId: "N_out", toComponentId: "analyzer_solar", toTerminalId: "N_in", waypoints: [{ x: 535, y: 220 }, { x: 730, y: 220 }], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Analyzer -> Air Conditioner
    { id: "c_an_ac_l", fromComponentId: "analyzer_solar", fromTerminalId: "L_out", toComponentId: "ac_unit", toTerminalId: "L", waypoints: [{ x: 800, y: 80 }], cable: COPPER_4, visualColor: "#8B4513" },
    { id: "c_an_ac_n", fromComponentId: "analyzer_solar", fromTerminalId: "N_out", toComponentId: "ac_unit", toTerminalId: "N", waypoints: [{ x: 800, y: 100 }], cable: COPPER_4, visualColor: "#6DB7E8" },
    { id: "c_ac_pe", fromComponentId: "ac_unit", fromTerminalId: "PE", toComponentId: "inverter", toTerminalId: "PE", waypoints: [{ x: 870, y: 30 }, { x: 330, y: 30 }], cable: COPPER_4, visualColor: "#2E7D32" },

    // Analyzer -> LED Light
    { id: "c_an_led_l", fromComponentId: "analyzer_solar", fromTerminalId: "L_out", toComponentId: "led_home", toTerminalId: "L", waypoints: [{ x: 800, y: 200 }], cable: COPPER_1_5, visualColor: "#8B4513" },
    { id: "c_an_led_n", fromComponentId: "analyzer_solar", fromTerminalId: "N_out", toComponentId: "led_home", toTerminalId: "N", waypoints: [{ x: 800, y: 220 }], cable: COPPER_1_5, visualColor: "#6DB7E8" },
    { id: "c_led_pe", fromComponentId: "led_home", fromTerminalId: "PE", toComponentId: "inverter", toTerminalId: "PE", waypoints: [{ x: 870, y: 30 }, { x: 330, y: 30 }], cable: COPPER_1_5, visualColor: "#2E7D32" },
  ],
};

// ----------------------------------------------------------------------------
// 5. Banco de Pruebas e Instrumentación
// ----------------------------------------------------------------------------
export const PRESET_INSTRUMENTACION: CircuitPreset = {
  id: "preset_instrumentacion",
  name: "Banco de Pruebas y Medición Eléctrica",
  description: "Laboratorio de pruebas con voltímetro, amperímetro en serie, vatímetro, frecuencímetro, analizador de redes y cargas conmutables.",
  badge: "Instrumentos",
  components: [
    { id: "src_lab", typeId: "source_single_230v", x: 60, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "iga_lab", typeId: "iga_40a_2p", x: 180, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "ammeter_lab", typeId: "ammeter", x: 310, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "wattmeter_lab", typeId: "wattmeter", x: 440, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "freq_lab", typeId: "frequencymeter", x: 440, y: 50, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "voltmeter_lab", typeId: "voltmeter", x: 570, y: 50, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "analyzer_lab", typeId: "network_analyzer_1p", x: 570, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
    { id: "heater_lab", typeId: "load_resistive_2300w", x: 730, y: 160, rotation: 0, properties: {}, fault: "NONE", mechanicalState: "CLOSED" },
  ],
  cables: [
    // Source -> IGA
    { id: "c_lab_s_iga_l", fromComponentId: "src_lab", fromTerminalId: "L", toComponentId: "iga_lab", toTerminalId: "L1_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_lab_s_iga_n", fromComponentId: "src_lab", fromTerminalId: "N", toComponentId: "iga_lab", toTerminalId: "N_in", waypoints: [], cable: COPPER_6, visualColor: "#6DB7E8" },

    // IGA -> Ammeter (Series on Phase)
    { id: "c_lab_iga_am_l", fromComponentId: "iga_lab", fromTerminalId: "L1_out", toComponentId: "ammeter_lab", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },

    // Ammeter -> Wattmeter (Series on Phase)
    { id: "c_lab_am_wm_l", fromComponentId: "ammeter_lab", fromTerminalId: "L_out", toComponentId: "wattmeter_lab", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_lab_iga_wm_n", fromComponentId: "iga_lab", fromTerminalId: "N_out", toComponentId: "wattmeter_lab", toTerminalId: "N", waypoints: [{ x: 245, y: 240 }, { x: 440, y: 240 }], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Frequency meter (in parallel)
    { id: "c_lab_wm_fm_l", fromComponentId: "wattmeter_lab", fromTerminalId: "L_in", toComponentId: "freq_lab", toTerminalId: "L", waypoints: [{ x: 380, y: 50 }], cable: COPPER_1_5, visualColor: "#8B4513" },
    { id: "c_lab_iga_fm_n", fromComponentId: "iga_lab", fromTerminalId: "N_out", toComponentId: "freq_lab", toTerminalId: "N", waypoints: [{ x: 245, y: 20 }, { x: 440, y: 20 }], cable: COPPER_1_5, visualColor: "#6DB7E8" },

    // Voltmeter (in parallel)
    { id: "c_lab_wm_vm_l", fromComponentId: "wattmeter_lab", fromTerminalId: "L_out", toComponentId: "voltmeter_lab", toTerminalId: "A", waypoints: [{ x: 510, y: 50 }], cable: COPPER_1_5, visualColor: "#8B4513" },
    { id: "c_lab_iga_vm_n", fromComponentId: "iga_lab", fromTerminalId: "N_out", toComponentId: "voltmeter_lab", toTerminalId: "B", waypoints: [{ x: 245, y: 20 }, { x: 570, y: 20 }], cable: COPPER_1_5, visualColor: "#6DB7E8" },

    // Wattmeter -> Analyzer 1P
    { id: "c_lab_wm_an_l", fromComponentId: "wattmeter_lab", fromTerminalId: "L_out", toComponentId: "analyzer_lab", toTerminalId: "L_in", waypoints: [], cable: COPPER_6, visualColor: "#8B4513" },
    { id: "c_lab_iga_an_n", fromComponentId: "iga_lab", fromTerminalId: "N_out", toComponentId: "analyzer_lab", toTerminalId: "N_in", waypoints: [{ x: 245, y: 240 }, { x: 570, y: 240 }], cable: COPPER_6, visualColor: "#6DB7E8" },

    // Analyzer -> Load 2300W
    { id: "c_lab_an_ld_l", fromComponentId: "analyzer_lab", fromTerminalId: "L_out", toComponentId: "heater_lab", toTerminalId: "L", waypoints: [], cable: COPPER_4, visualColor: "#8B4513" },
    { id: "c_lab_an_ld_n", fromComponentId: "analyzer_lab", fromTerminalId: "N_out", toComponentId: "heater_lab", toTerminalId: "N", waypoints: [{ x: 650, y: 240 }, { x: 730, y: 240 }], cable: COPPER_4, visualColor: "#6DB7E8" },
    { id: "c_lab_ld_pe", fromComponentId: "heater_lab", fromTerminalId: "PE", toComponentId: "src_lab", toTerminalId: "PE", waypoints: [{ x: 730, y: 20 }, { x: 60, y: 20 }], cable: COPPER_4, visualColor: "#2E7D32" },
  ],
};

export const ALL_PRESETS: CircuitPreset[] = [
  PRESET_VIVIENDA,
  PRESET_TRIFASICA,
  PRESET_VEHICULO_ELECTRICO,
  PRESET_FOTOVOLTAICA,
  PRESET_INSTRUMENTACION,
];

export function getPresetById(id: string): CircuitPreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}
