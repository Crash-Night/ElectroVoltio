// ============================================================================
// ElectroVoltio - Single Version API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

// GET /api/projects/:id/versions/:version
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { id, version: versionStr } = await params;
    const version = parseInt(versionStr, 10);

    if (isNaN(version)) {
      return NextResponse.json(
        { error: "ERR_INVALID_DATA", message: "Versión inválida" },
        { status: 400 }
      );
    }

    const [v] = await db
      .select()
      .from(schema.projectVersions)
      .where(
        and(
          eq(schema.projectVersions.projectId, id),
          eq(schema.projectVersions.version, version)
        )
      );

    if (!v) {
      return NextResponse.json(
        { error: "ERR_NOT_FOUND", message: "Versión no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(v);
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: "ERR_VERSION_LOAD", message: "Error al cargar versión" },
      { status: 500 }
    );
  }
}
