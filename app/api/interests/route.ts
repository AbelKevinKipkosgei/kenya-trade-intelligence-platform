import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { userInterests } from "@/db/schema";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const rows = await db
    .select({ id: userInterests.id, sectorId: userInterests.sectorId, countryId: userInterests.countryId })
    .from(userInterests)
    .where(eq(userInterests.clerkUserId, userId));

  return Response.json({ interests: rows });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

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
        eq(userInterests.clerkUserId, userId),
        sectorId ? eq(userInterests.sectorId, sectorId) : eq(userInterests.countryId, countryId!),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(userInterests).where(eq(userInterests.id, existing[0].id));
    return Response.json({ following: false });
  }

  await db.insert(userInterests).values({ clerkUserId: userId, sectorId, countryId });
  return Response.json({ following: true });
}
