// ============================================================================
// ElectroVoltio - Project Versions API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { sql } from "drizzle-orm";

const CreateVersionSchema = z.object({
  snapshot: z.object({
    components: z.array(z.any()),
    cables: z.array(z.any()),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
  }),
  expectedVersion: z.number().int().positive(),
});

// GET /api/projects/:id/versions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const versions = await db
      .select({
        id: schema.projectVersions.id,
        projectId: schema.projectVersions.projectId,
        version: schema.projectVersions.version,
        createdAt: schema.projectVersions.createdAt,
      })
      .from(schema.projectVersions)
      .where(eq(schema.projectVersions.projectId, id))
      .orderBy(schema.projectVersions.version);

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error listing versions:", error);
    return NextResponse.json(
      { error: "ERR_VERSION_LIST", message: "Error al listar versiones" },
      { status: 500 }
    );
  }
}

// POST /api/projects/:id/versions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = CreateVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ERR_INVALID_DATA", message: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { snapshot, expectedVersion } = parsed.data;

    // Check project exists and version matches (optimistic concurrency)
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

    // Optimistic concurrency control
    if (project.version !== expectedVersion) {
      return NextResponse.json(
        {
          error: "ERR_VERSION_CONFLICT",
          message: "El proyecto ha sido modificado desde otra sesión. Recarga la versión más reciente antes de guardar.",
          currentVersion: project.version,
          expectedVersion,
        },
        { status: 409 }
      );
    }

    const newVersion = project.version + 1;

    // Create new version in a transaction
    const result = await db.transaction(async (tx) => {
      // Update project version
      const [updatedProject] = await tx
        .update(schema.projects)
        .set({ version: newVersion, updatedAt: new Date() })
        .where(eq(schema.projects.id, id))
        .returning();

      // Insert new version
      const [version] = await tx
        .insert(schema.projectVersions)
        .values({
          projectId: id,
          version: newVersion,
          snapshot,
        })
        .returning();

      // Log event
      await tx
        .insert(schema.projectEvents)
        .values({
          projectId: id,
          projectVersionId: version.id,
          eventType: "VERSION_CREATED",
          payload: { version: newVersion },
        });

      return { project: updatedProject, version };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "ERR_VERSION_CREATE", message: "Error al crear versión" },
      { status: 500 }
    );
  }
}
