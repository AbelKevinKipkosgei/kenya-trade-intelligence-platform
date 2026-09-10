import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { countries } from "@/db/schema";

/**
 * GET /api/reference/countries
 * Fetch all countries for target market selection.
 */
export async function GET() {
  try {
    const allCountries = await db
      .select()
      .from(countries)
      .orderBy(countries.name);

    return NextResponse.json({ countries: allCountries });
  } catch (error) {
    console.error("Fetch countries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
