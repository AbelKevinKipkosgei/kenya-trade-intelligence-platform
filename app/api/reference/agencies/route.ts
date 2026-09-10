import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { agencies } from "@/db/schema";

/**
 * GET /api/reference/agencies
 * Fetch all government agencies for dropdown selection.
 */
export async function GET() {
  try {
    const allAgencies = await db.select().from(agencies).orderBy(agencies.name);

    return NextResponse.json({ agencies: allAgencies });
  } catch (error) {
    console.error("Fetch agencies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agencies" },
      { status: 500 }
    );
  }
}
