// ============================================================================
// ElectroVoltio - Projects API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  components: z.array(z.any()).optional().default([]),
  cables: z.array(z.any()).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

const ImportSchema = z.object({
  app: z.literal("ElectroVoltio"),
  version: z.number(),
  project: z.object({
    name: z.string().min(1).max(200),
    components: z.array(z.any()),
    cables: z.array(z.any()),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
  }),
});

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await db
      .select()
      .from(schema.projects)
      .where(isNull(schema.projects.deletedAt))
      .orderBy(schema.projects.updatedAt);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error listing projects:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_LIST", message: "Error al listar proyectos" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's an import
    if (body.app === "ElectroVoltio") {
      return handleImport(body);
    }

    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ERR_INVALID_DATA", message: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, components, cables, metadata } = parsed.data;

    // Create project in a transaction
    const result = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(schema.projects)
        .values({ name })
        .returning();

      // Create initial settings
      await tx
        .insert(schema.projectSettings)
        .values({ projectId: project.id });

      // Create initial version (version 1)
      const snapshot = { components, cables, metadata };
      const [version] = await tx
        .insert(schema.projectVersions)
        .values({
          projectId: project.id,
          version: 1,
          snapshot,
        })
        .returning();

      // Log event
      await tx
        .insert(schema.projectEvents)
        .values({
          projectId: project.id,
          projectVersionId: version.id,
          eventType: "PROJECT_CREATED",
          payload: { name },
        });

      return project;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_CREATE", message: "Error al crear proyecto" },
      { status: 500 }
    );
  }
}

async function handleImport(body: unknown) {
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ERR_INVALID_IMPORT", message: "Formato de importación inválido", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { project } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(schema.projects)
        .values({ name: project.name })
        .returning();

      await tx
        .insert(schema.projectSettings)
        .values({ projectId: newProject.id });

      const snapshot = {
        components: project.components,
        cables: project.cables,
        metadata: project.metadata || {},
      };

      const [version] = await tx
        .insert(schema.projectVersions)
        .values({
          projectId: newProject.id,
          version: 1,
          snapshot,
        })
        .returning();

      await tx
        .insert(schema.projectEvents)
        .values({
          projectId: newProject.id,
          projectVersionId: version.id,
          eventType: "PROJECT_IMPORTED",
          payload: { source: "file" },
        });

      return newProject;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error importing project:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_IMPORT", message: "Error al importar proyecto" },
      { status: 500 }
    );
  }
}
