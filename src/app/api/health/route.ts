import { NextResponse } from "next/server";
import { db } from "@/drizzle/client";

export async function GET(): Promise<NextResponse> {
  try {
    await db.execute(`SELECT 1 as health_check`);
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    // Health check failed error logged for debugging
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        environment: process.env.NODE_ENV,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}