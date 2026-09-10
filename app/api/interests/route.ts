import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { userInterests } from "@/db/schema";

export async function GET() {
  const session = await requireAuth();
  const authUserId = session.user.id;

  const rows = await db
    .select({ id: userInterests.id, sectorId: userInterests.sectorId, countryId: userInterests.countryId })
    .from(userInterests)
    .where(eq(userInterests.authUserId, authUserId));

  return Response.json({ interests: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const authUserId = session.user.id;

  const body = await req.json().catch(() => null);
  const sectorId = typeof body?.sectorId === "number" ? body.sectorId : null;
  const countryId = typeof body?.countryId === "number" ? body.countryId : null;
  if (!sectorId && !countryId) {
    return new Response("Expected a sectorId or countryId.", { status: 400 });
  }

  // Toggle semantics: if this exact follow already exists, remove it instead
  // of inserting a duplicate — keeps the picker UI a simple click-to-toggle
  // without needing a separate "already following" check on the client.
  const existing = await db
    .select({ id: userInterests.id })
    .from(userInterests)
    .where(
      and(
        eq(userInterests.authUserId, authUserId),
        sectorId ? eq(userInterests.sectorId, sectorId) : eq(userInterests.countryId, countryId!),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(userInterests).where(eq(userInterests.id, existing[0].id));
    return Response.json({ following: false });
  }

  await db.insert(userInterests).values({ authUserId, sectorId, countryId });
  return Response.json({ following: true });
}
