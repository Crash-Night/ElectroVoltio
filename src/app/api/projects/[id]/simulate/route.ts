// ============================================================================
// ElectroVoltio - Simulation API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { simulate, DEFAULT_SIM_CONFIG, DEFAULT_PREVIOUS_STATE } from "@/engine";
import { CircuitModel, SimulationConfig } from "@/engine/types";
import { z } from "zod";

const SimulateSchema = z.object({
  circuit: z.object({
    components: z.array(z.object({
      id: z.string(),
      typeId: z.string(),
      x: z.number(),
      y: z.number(),
      rotation: z.number(),
      properties: z.record(z.string(), z.unknown()),
      fault: z.enum(["NONE", "OPEN", "SHORT", "LEAK", "ARC", "OVERVOLTAGE", "UNDERVOLTAGE", "RS485_FAULT"]),
      faultParameters: z.record(z.string(), z.unknown()).optional(),
      mechanicalState: z.enum(["CLOSED", "OPEN", "TRIPPED", "BLOWN", "WELDED", "FAILED"]),
    })),
    cables: z.array(z.object({
      id: z.string(),
      fromComponentId: z.string(),
      fromTerminalId: z.string(),
      toComponentId: z.string(),
      toTerminalId: z.string(),
      waypoints: z.array(z.object({ x: z.number(), y: z.number() })),
      visualColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      cable: z.object({
        conductorMaterial: z.enum(["copper", "aluminum"]),
        crossSection: z.number().positive(),
        length: z.number().positive(),
        insulationType: z.string(),
        maxTemperature: z.number(),
        resistivity: z.number().positive(),
        temperatureCoeff: z.number(),
        reactancePerKm: z.number(),
        cores: z.number().int().positive(),
        installationMethod: z.string().optional(),
      }),
    })),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
  }),
  config: z.object({
    frequency: z.number().positive(),
    ambientTemperature: z.number(),
    tickHz: z.number().positive(),
    substeps: z.number().int().positive(),
    maxIterations: z.number().int().positive(),
    tolerance: z.number().positive(),
    convergenceMethod: z.enum(["gauss_seidel", "newton_raphson"]),
  }).optional(),
});

// POST /api/projects/:id/simulate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();

    const parsed = SimulateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ERR_INVALID_CIRCUIT", message: "Circuito inválido", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const circuit: CircuitModel = parsed.data.circuit;
    const config: SimulationConfig = parsed.data.config || DEFAULT_SIM_CONFIG;

    // Run simulation (engine is pure, no side effects)
    const result = simulate(circuit, DEFAULT_PREVIOUS_STATE, config);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in simulation:", error);
    return NextResponse.json(
      { error: "ERR_SIMULATION", message: "Error en la simulación" },
      { status: 500 }
    );
  }
}
