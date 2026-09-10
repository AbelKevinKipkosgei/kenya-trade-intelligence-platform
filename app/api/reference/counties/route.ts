import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { counties } from "@/db/schema";

/**
 * GET /api/reference/counties
 * Fetch all Kenyan counties for dropdown selection.
 */
export async function GET() {
  try {
    const allCounties = await db.select().from(counties).orderBy(counties.name);

    return NextResponse.json({ counties: allCounties });
  } catch (error) {
    console.error("Fetch counties error:", error);
    return NextResponse.json(
      { error: "Failed to fetch counties" },
      { status: 500 }
    );
  }
}
