import { or, ilike } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { products } from "@/db/schema";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json({ results: [] });
  }

  const rows = await db
    .select({ id: products.id, hsCode: products.hsCode, description: products.description })
    .from(products)
    .where(or(ilike(products.hsCode, `%${q}%`), ilike(products.description, `%${q}%`)))
    .limit(15);

  return Response.json({ results: rows });
}
