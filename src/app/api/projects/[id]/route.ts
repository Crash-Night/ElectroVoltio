// ============================================================================
// ElectroVoltio - Single Project API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

// GET /api/projects/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), isNull(schema.projects.deletedAt)));

    if (!project) {
      return NextResponse.json(
        { error: "ERR_NOT_FOUND", message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Get latest version
    const versions = await db
      .select()
      .from(schema.projectVersions)
      .where(eq(schema.projectVersions.projectId, id))
      .orderBy(schema.projectVersions.version);

    // Get settings
    const [settings] = await db
      .select()
      .from(schema.projectSettings)
      .where(eq(schema.projectSettings.projectId, id));

    const latestVersion = versions[versions.length - 1];

    return NextResponse.json({
      ...project,
      snapshot: latestVersion?.snapshot || { components: [], cables: [], metadata: {} },
      settings: settings || null,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_LOAD", message: "Error al cargar proyecto" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ERR_INVALID_DATA", message: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check project exists
    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), isNull(schema.projects.deletedAt)));

    if (!existing) {
      return NextResponse.json(
        { error: "ERR_NOT_FOUND", message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(schema.projects)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_UPDATE", message: "Error al actualizar proyecto" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), isNull(schema.projects.deletedAt)));

    if (!existing) {
      return NextResponse.json(
        { error: "ERR_NOT_FOUND", message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    await db
      .update(schema.projects)
      .set({ deletedAt: new Date() })
      .where(eq(schema.projects.id, id));

    // Log event
    await db.insert(schema.projectEvents).values({
      projectId: id,
      eventType: "PROJECT_DELETED",
      payload: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_DELETE", message: "Error al eliminar proyecto" },
      { status: 500 }
    );
  }
}
