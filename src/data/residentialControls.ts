// ============================================================================
// ElectroVoltio - Residential control & appliance catalog
// Switches, pushbuttons, sensors, sockets, lights and motors
// ============================================================================

import {
  BranchDefinition,
  ElectricalComponentModel,
  ResidentialControlModel,
  TerminalDefinition,
} from "@/engine/types";

function terminal(
  id: string,
  name: string,
  phase: TerminalDefinition["phase"],
  role: TerminalDefinition["role"],
  direction: TerminalDefinition["direction"] = "bidirectional"
): TerminalDefinition {
  return { id, name, phase, role, direction };
}

function branch(
  id: string,
  from: string,
  to: string,
  resistance: number,
  reactance = 0,
  phase: TerminalDefinition["phase"] = "L1",
  enabled = true
): BranchDefinition {
  return { id, fromTerminal: from, toTerminal: to, resistance, reactance, enabled, phase };
}

function controlModel(
  kind: ResidentialControlModel["kind"],
  extras: Partial<ResidentialControlModel> = {}
): ResidentialControlModel {
  return {
    kind,
    poles: 1,
    defaultOn: true,
    isMomentary: false,
    isNormallyClosed: false,
    hasIndicator: false,
    isTimed: false,
    defaultDurationSec: 0,
    supportsDimmer: false,
    supportsSmoke: false,
    supportsBell: false,
    supportsMotor: false,
    canToggle: true,
    ...extras,
  };
}

function switchDevice(
  typeId: string,
  name: string,
  poles = 1,
  extras: Partial<ResidentialControlModel> = {}
): ElectricalComponentModel {
  const terminals: TerminalDefinition[] = [
    terminal("L_in", "L in", "L1", "phase", "in"),
    terminal("L_out", "L out", "L1", "phase", "out"),
  ];
  const branches: BranchDefinition[] = [
    branch("b_sw", "L_in", "L_out", 0.01, 0.001, "L1"),
  ];

  if (poles >= 2) {
    terminals.push(terminal("N_in", "N in", "N", "neutral", "in"));
    terminals.push(terminal("N_out", "N out", "N", "neutral", "out"));
    branches.push(branch("b_n", "N_in", "N_out", 0.01, 0.001, "N"));
  }

  return {
    typeId,
    name,
    category: "residential",
    terminalLayout: "default",
    terminals,
    branches,
    residentialControl: controlModel("switch", { poles, defaultOn: true, ...extras }),
    ratedVoltage: 230,
    ratedCurrent: poles >= 2 ? 16 : 10,
    normativeReferences: ["IEC 60669-1"],
  };
}

function pushbuttonDevice(
  typeId: string,
  name: string,
  normallyClosed = false,
  extras: Partial<ResidentialControlModel> = {}
): ElectricalComponentModel {
  return {
    typeId,
    name,
    category: "residential",
    terminals: [
      terminal("L_in", "L in", "L1", "phase", "in"),
      terminal("L_out", "L out", "L1", "phase", "out"),
    ],
    branches: [branch("b_pb", "L_in", "L_out", 0.01, 0.001, "L1")],
    residentialControl: controlModel("pushbutton", {
      isMomentary: true,
      isNormallyClosed: normallyClosed,
      defaultOn: normallyClosed,
      ...extras,
    }),
    ratedVoltage: 230,
    ratedCurrent: 10,
    normativeReferences: ["IEC 60947-5-1"],
  };
}

function loadDevice(
  typeId: string,
  name: string,
  powerW: number,
  extras: Partial<ResidentialControlModel> = {},
  reactance = 0
): ElectricalComponentModel {
  const resistance = powerW > 0 ? (230 * 230) / powerW : 1e6;
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
      type: reactance > 0 ? "inductive" : "resistive",
      ratedPower: powerW,
      ratedVoltage: 230,
      resistance,
      powerFactor: reactance > 0 ? 0.85 : 1,
      phases: ["L1"],
      needsNeutral: true,
    },
    residentialControl: controlModel("load", {
      defaultOn: true,
      canToggle: true,
      ...extras,
    }),
    ratedVoltage: 230,
    ratedCurrent: Math.max(1, Math.ceil(powerW / 230)),
  };
}

export const RESIDENTIAL_CONTROLS: ElectricalComponentModel[] = [
  // Switches
  switchDevice("sw_simple", "Interruptor simple"),
  switchDevice("sw_bipolar", "Interruptor bipolar", 2),
  switchDevice("sw_double", "Interruptor doble", 1, { poles: 2 }),
  switchDevice("sw_triple", "Interruptor triple", 1, { poles: 3 }),
  switchDevice("sw_conmutador", "Conmutador"),
  switchDevice("sw_conmutador_doble", "Conmutador doble", 1, { poles: 2 }),
  switchDevice("sw_conmutador_triple", "Conmutador triple", 1, { poles: 3 }),
  switchDevice("sw_cruzamiento", "Cruzamiento"),
  switchDevice("sw_cruzamiento_doble", "Cruzamiento doble", 1, { poles: 2 }),
  switchDevice("sw_persiana", "Interruptor de persiana", 1, { supportsMotor: true }),
  switchDevice("sw_toldo", "Interruptor de toldo", 1, { supportsMotor: true }),
  switchDevice("sw_selector_man_auto", "Selector manual/automático"),
  switchDevice("sw_llave", "Interruptor de llave"),
  switchDevice("sw_tirador", "Interruptor de tirador"),
  switchDevice("sw_pedal", "Interruptor de pedal"),
  switchDevice("sw_fin_carrera", "Interruptor de fin de carrera"),
  switchDevice("sw_magnetico", "Interruptor magnético"),
  switchDevice("sw_flotador", "Interruptor de flotador"),
  switchDevice("sw_inteligente", "Interruptor inteligente", 1, { kind: "smart" }),
  switchDevice("sw_wifi", "Interruptor Wi-Fi", 1, { kind: "smart" }),
  switchDevice("sw_inteligente_doble", "Interruptor inteligente doble", 1, { kind: "smart", poles: 2 }),
  switchDevice("sw_conmutador_inteligente", "Conmutador inteligente", 1, { kind: "smart" }),

  // Pushbuttons
  pushbuttonDevice("pb_no", "Pulsador normalmente abierto (NO)", false),
  pushbuttonDevice("pb_nc", "Pulsador normalmente cerrado (NC)", true),
  pushbuttonDevice("pb_timbre", "Pulsador de timbre", false, { supportsBell: true }),
  pushbuttonDevice("pb_luminoso", "Pulsador luminoso", false, { hasIndicator: true }),
  pushbuttonDevice("pb_doble", "Pulsador doble", false, { poles: 2 }),
  pushbuttonDevice("pb_piloto", "Pulsador con piloto indicador", false, { hasIndicator: true }),
  pushbuttonDevice("pb_temporizado", "Pulsador temporizado", false, { isTimed: true, defaultDurationSec: 30 }),
  pushbuttonDevice("pb_persiana", "Pulsador de persiana", false, { supportsMotor: true }),
  pushbuttonDevice("pb_apertura_puerta", "Pulsador de apertura de puerta", false),
  pushbuttonDevice("pb_inteligente", "Pulsador inteligente", false, { kind: "smart" }),

  // Dimmers / timers / sensors / relays
  {
    typeId: "dimmer",
    name: "Regulador de intensidad (Dimmer)",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_dim", "L_in", "L_out", 0.05, 0.01, "L1")],
    residentialControl: controlModel("dimmer", { supportsDimmer: true, defaultOn: true }),
    ratedVoltage: 230,
    ratedCurrent: 5,
  },
  {
    typeId: "dimmer_push",
    name: "Dimmer con pulsador",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_dim", "L_in", "L_out", 0.05, 0.01, "L1")],
    residentialControl: controlModel("dimmer", { supportsDimmer: true, isMomentary: true, defaultOn: true }),
    ratedVoltage: 230,
    ratedCurrent: 5,
  },
  {
    typeId: "sw_crepuscular",
    name: "Interruptor crepuscular",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("sensor", { defaultOn: true }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "sw_horario",
    name: "Interruptor horario",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("timer", { isTimed: true, defaultDurationSec: 60, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 16,
  },
  {
    typeId: "timer_escalera",
    name: "Temporizador de escalera",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("timer", { isTimed: true, defaultDurationSec: 60, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "pir_motion",
    name: "Detector de movimiento (PIR)",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out"), terminal("N", "N", "N", "neutral", "in")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("sensor", { isTimed: true, defaultDurationSec: 20, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "presence_sensor",
    name: "Detector de presencia",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out"), terminal("N", "N", "N", "neutral", "in")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("sensor", { isTimed: true, defaultDurationSec: 30, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "relay_impulse",
    name: "Relé de impulso (Telerruptor)",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("relay", { defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 16,
  },
  {
    typeId: "relay_timed",
    name: "Relé temporizado",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("timer", { isTimed: true, defaultDurationSec: 45, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 16,
  },
  {
    typeId: "shutter_comm",
    name: "Conmutador de persiana",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("shutter", { supportsMotor: true, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "shutter_motor_ctrl",
    name: "Control de persiana motorizada",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out"), terminal("N", "N", "N", "neutral", "in")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("shutter", { supportsMotor: true, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "shutter_smart",
    name: "Controlador inteligente de persiana",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out"), terminal("N", "N", "N", "neutral", "in")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("smart", { supportsMotor: true, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "dimmer_smart",
    name: "Dimmer inteligente",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_dim", "L_in", "L_out", 0.05, 0.01, "L1")],
    residentialControl: controlModel("smart", { supportsDimmer: true, defaultOn: true }),
    ratedVoltage: 230,
    ratedCurrent: 5,
  },
  {
    typeId: "motion_smart",
    name: "Sensor de movimiento inteligente",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out"), terminal("N", "N", "N", "neutral", "in")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("smart", { isTimed: true, defaultDurationSec: 25, defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 10,
  },
  {
    typeId: "door_window_sensor",
    name: "Sensor de apertura de puerta/ventana",
    category: "residential",
    terminals: [terminal("L_in", "L in", "L1", "phase", "in"), terminal("L_out", "L out", "L1", "phase", "out")],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("sensor", { defaultOn: false }),
    ratedVoltage: 230,
    ratedCurrent: 2,
  },

  // Thermostats / door systems / signals
  loadDevice("thermostat", "Termostato", 5, { kind: "sensor", defaultOn: true }),
  loadDevice("thermostat_smart", "Termostato inteligente", 8, { kind: "smart", defaultOn: true }),
  loadDevice("doorbell_unit", "Timbre", 8, { supportsBell: true, defaultOn: false }),
  loadDevice("buzzer", "Zumbador", 6, { supportsBell: true, defaultOn: false }),
  loadDevice("bell_campana", "Campana", 12, { supportsBell: true, defaultOn: false }),
  loadDevice("door_phone", "Portero automático", 15, { kind: "signal", defaultOn: false }),
  loadDevice("video_door_phone", "Videoportero", 25, { kind: "signal", defaultOn: false }),
  loadDevice("electric_lock", "Cerradura eléctrica", 20, { kind: "signal", defaultOn: false }),

  // Sockets / multimedia outlets
  loadDevice("socket_simple", "Enchufe simple", 0, { kind: "socket", defaultOn: true }),
  loadDevice("socket_double", "Enchufe doble", 0, { kind: "socket", defaultOn: true }),
  loadDevice("socket_with_switch", "Enchufe con interruptor", 0, { kind: "socket", defaultOn: true }),
  loadDevice("socket_protected", "Enchufe con tapa de protección", 0, { kind: "socket", defaultOn: true }),
  loadDevice("socket_ip44", "Enchufe estanco", 0, { kind: "socket", defaultOn: true }),
  loadDevice("socket_usb_a", "Enchufe con USB-A", 12, { kind: "socket", defaultOn: true }),
  loadDevice("socket_usb_c", "Enchufe con USB-C", 18, { kind: "socket", defaultOn: true }),
  loadDevice("socket_usb_ac", "Enchufe con USB-A y USB-C", 25, { kind: "socket", defaultOn: true }),
  loadDevice("outlet_tv", "Toma de TV", 1, { kind: "socket", defaultOn: true }),
  loadDevice("outlet_radio", "Toma de radio", 1, { kind: "socket", defaultOn: true }),
  loadDevice("outlet_rj45", "Toma RJ45", 1, { kind: "socket", defaultOn: true }),
  loadDevice("outlet_rj11", "Toma telefónica RJ11", 1, { kind: "socket", defaultOn: true }),
  loadDevice("outlet_hdmi", "Toma HDMI", 1, { kind: "socket", defaultOn: true }),
  loadDevice("outlet_coax", "Toma coaxial", 1, { kind: "socket", defaultOn: true }),

  // Lighting / fans / motors
  loadDevice("lamp_ceiling", "Lámpara de techo", 18, { kind: "load", defaultOn: true }),
  loadDevice("lamp_wall", "Lámpara de pared", 12, { kind: "load", defaultOn: true }),
  loadDevice("wall_sconce", "Aplique de pared", 10, { kind: "load", defaultOn: true }),
  loadDevice("lamp_holder", "Portalámparas", 8, { kind: "load", defaultOn: true }),
  loadDevice("bulb_led", "Bombilla LED", 9, { kind: "load", defaultOn: true }),
  loadDevice("bulb_halogen", "Bombilla halógena", 40, { kind: "load", defaultOn: true }),
  loadDevice("downlight_led", "Downlight LED", 12, { kind: "load", defaultOn: true }),
  loadDevice("panel_led", "Panel LED", 36, { kind: "load", defaultOn: true }),
  loadDevice("strip_led", "Tira LED", 24, { kind: "load", defaultOn: true }),
  loadDevice("emergency_light", "Lámpara de emergencia", 5, { kind: "load", defaultOn: true }),
  loadDevice("ceiling_fan", "Ventilador de techo", 60, { kind: "load", defaultOn: true }, 4),
  loadDevice("bath_extractor", "Extractor de baño", 45, { kind: "load", defaultOn: true }, 3),
  loadDevice("motor_electric", "Motor eléctrico monofásico", 750, { kind: "load", supportsMotor: true, defaultOn: true }, 8),

  // Smoke detector (realistic smoke simulation)
  {
    typeId: "load_smoke_detector",
    name: "Detector de humos",
    category: "residential",
    terminalLayout: "residential",
    terminals: [
      terminal("L", "L", "L1", "phase", "in"),
      terminal("PE", "PE", "PE", "protective", "in"),
      terminal("N", "N", "N", "neutral", "out"),
    ],
    branches: [branch("b_load", "L", "N", 230000, 0, "L1")],
    load: {
      type: "resistive",
      ratedPower: 0.23,
      ratedVoltage: 230,
      resistance: 230000,
      phases: ["L1"],
      needsNeutral: true,
    },
    residentialControl: controlModel("sensor", {
      supportsSmoke: true,
      defaultOn: true,
      canToggle: true,
    }),
    ratedVoltage: 230,
    ratedCurrent: 1,
  },

  // Doorbell / intercom (visual active state)
  {
    typeId: "load_doorbell",
    name: "Timbre / Intercomunicador",
    category: "residential",
    terminalLayout: "residential",
    terminals: [
      terminal("L", "L", "L1", "phase", "in"),
      terminal("PE", "PE", "PE", "protective", "in"),
      terminal("N", "N", "N", "neutral", "out"),
    ],
    branches: [branch("b_load", "L", "N", 5000, 50, "L1")],
    load: {
      type: "impedance",
      ratedPower: 10,
      ratedVoltage: 230,
      impedance: { r: 5000, x: 50 },
      powerFactor: 0.95,
      phases: ["L1"],
      needsNeutral: true,
    },
    residentialControl: controlModel("signal", {
      supportsBell: true,
      defaultOn: false,
      canToggle: true,
      isMomentary: true,
      defaultDurationSec: 3,
      isTimed: true,
    }),
    ratedVoltage: 230,
    ratedCurrent: 1,
  },

  // Programmable timer (duration-based)
  {
    typeId: "load_timer",
    name: "Programador horario",
    category: "residential",
    terminalLayout: "default",
    terminals: [
      terminal("L_in", "L in", "L1", "phase", "in"),
      terminal("L_out", "L out", "L1", "phase", "out"),
      terminal("N", "N", "N", "neutral", "in"),
    ],
    branches: [branch("b_sw", "L_in", "L_out", 0.02, 0.001, "L1")],
    residentialControl: controlModel("timer", {
      isTimed: true,
      defaultDurationSec: 30,
      defaultOn: false,
      canToggle: true,
    }),
    ratedVoltage: 230,
    ratedCurrent: 16,
    normativeReferences: ["IEC 60669-2-1"],
  },
];
