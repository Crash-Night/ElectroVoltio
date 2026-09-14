// ============================================================================
// ElectroVoltio - Project Events API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const CreateEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()),
  projectVersionId: z.string().uuid().optional(),
});

// POST /api/projects/:id/events
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ERR_INVALID_DATA", message: "Datos inválidos" },
        { status: 400 }
      );
    }

    const [event] = await db
      .insert(schema.projectEvents)
      .values({
        projectId: id,
        ...parsed.data,
      })
      .returning();

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "ERR_EVENT_CREATE", message: "Error al crear evento" },
      { status: 500 }
    );
  }
}

// GET /api/projects/:id/events
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const events = await db
      .select()
      .from(schema.projectEvents)
      .where(eq(schema.projectEvents.projectId, id))
      .orderBy(schema.projectEvents.createdAt);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json(
      { error: "ERR_EVENT_LIST", message: "Error al listar eventos" },
      { status: 500 }
    );
  }
}
