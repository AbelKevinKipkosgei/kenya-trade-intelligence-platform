import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { sectors } from "@/db/schema";

/**
 * GET /api/reference/sectors
 * Fetch all sectors for dropdown selection.
 */
export async function GET() {
  try {
    const allSectors = await db.select().from(sectors).orderBy(sectors.name);

    return NextResponse.json({ sectors: allSectors });
  } catch (error) {
    console.error("Fetch sectors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sectors" },
      { status: 500 }
    );
  }
}
