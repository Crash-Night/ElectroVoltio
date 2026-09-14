// ============================================================================
// ElectroVoltio - Health Check API
// ============================================================================

import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute("SELECT 1 as ok");
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
