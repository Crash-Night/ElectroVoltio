// ============================================================================
// ElectroVoltio - Project Export API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/projects/:id/export
export async function POST(
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

    const latest = versions[versions.length - 1];
    const snapshot = (latest?.snapshot as { components?: unknown[]; cables?: unknown[]; metadata?: Record<string, unknown> }) || {
      components: [],
      cables: [],
      metadata: {},
    };

    const exportData = {
      app: "ElectroVoltio",
      version: 2,
      project: {
        name: project.name,
        components: snapshot.components || [],
        cables: snapshot.cables || [],
        metadata: snapshot.metadata || {},
      },
    };

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, "_")}.ev.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error exporting project:", error);
    return NextResponse.json(
      { error: "ERR_PROJECT_EXPORT", message: "Error al exportar proyecto" },
      { status: 500 }
    );
  }
}
