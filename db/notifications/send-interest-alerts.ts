import "../seed/load-env";
import { eq, gte, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { db, pool } from "../client";
import { userInterests, tradeBarriers, newsArticles, products, sectors, countries, users } from "../schema";

/**
 * Sends one digest email per user covering new trade barriers and news
 * articles matching their followed sectors/countries, reported/published
 * since the last run. Meant to run on a schedule (daily GitHub Action,
 * matching the pattern already used for the tariff sync) rather than
 * pg_cron, which is unavailable on this Neon plan (confirmed earlier).
 *
 * No per-user "last checked" state is tracked — this just looks back
 * LOOKBACK_HOURS from now, with a buffer over the cron interval. Simpler
 * than tracking state, at the cost of silently missing a day's items if
 * a scheduled run is ever skipped — an acceptable v1 trade-off, not
 * something to fix preemptively.
 *
 * Only trade_barriers and news_articles are covered in this first version
 * — tariff-rate changes and opportunity-score shifts need either a
 * tracked "changed at" timestamp or a period-over-period diff, neither of
 * which exists yet.
 */
const LOOKBACK_HOURS = 25;

type Barrier = {
  id: number;
  description: string;
  barrierType: string;
  impactLevel: string;
  countryId: number;
  countryName: string;
  sectorId: number | null;
  sectorName: string | null;
};

type News = {
  id: number;
  title: string;
  sourceUrl: string;
  countryId: number | null;
  countryName: string | null;
  sectorId: number | null;
  sectorName: string | null;
};

function buildDigestHtml(barriers: Barrier[], news: News[]): string {
  const barrierItems = barriers
    .map(
      (b) =>
        `<li><strong>${b.barrierType} (${b.impactLevel} impact)</strong> — ${b.description} — ${b.countryName}${b.sectorName ? ` · ${b.sectorName}` : ""}</li>`,
    )
    .join("");
  const newsItems = news
    .map(
      (n) =>
        `<li><a href="${n.sourceUrl}">${n.title}</a>${n.countryName ? ` — ${n.countryName}` : ""}${n.sectorName ? ` · ${n.sectorName}` : ""}</li>`,
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="color: #006400;">KTIP: updates on your followed interests</h2>
      ${barriers.length > 0 ? `<h3>New trade barriers</h3><ul>${barrierItems}</ul>` : ""}
      ${news.length > 0 ? `<h3>New trade news</h3><ul>${newsItems}</ul>` : ""}
      <p style="color: #666; font-size: 12px;">
        You're receiving this because you follow one or more of the sectors/markets above on the
        Kenya Trade Intelligence Platform. Manage your interests at /interests.
      </p>
    </div>
  `;
}

async function main() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not set.");
  const resend = new Resend(resendApiKey);

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

  const interestRows = await db.select().from(userInterests);
  if (interestRows.length === 0) {
    console.log("No followed interests, nothing to do.");
    await pool.end();
    return;
  }

  const byUser = new Map<number, { sectorIds: Set<number>; countryIds: Set<number> }>();
  for (const row of interestRows) {
    if (!byUser.has(row.userId)) {
      byUser.set(row.userId, { sectorIds: new Set(), countryIds: new Set() });
    }
    const entry = byUser.get(row.userId)!;
    if (row.sectorId) entry.sectorIds.add(row.sectorId);
    if (row.countryId) entry.countryIds.add(row.countryId);
  }

  // Email lives directly in our own users table now (NextAuth, not an
  // external identity provider) — one query up front instead of an API
  // call per user.
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.id, [...byUser.keys()]));
  const emailById = new Map(userRows.map((u) => [u.id, u.email]));

  const [recentBarriers, recentNews] = await Promise.all([
    db
      .select({
        id: tradeBarriers.id,
        description: tradeBarriers.description,
        barrierType: tradeBarriers.barrierType,
        impactLevel: tradeBarriers.impactLevel,
        countryId: tradeBarriers.countryId,
        countryName: countries.name,
        sectorId: products.sectorId,
        sectorName: sectors.name,
      })
      .from(tradeBarriers)
      .leftJoin(products, eq(products.id, tradeBarriers.productId))
      .leftJoin(sectors, eq(sectors.id, products.sectorId))
      .innerJoin(countries, eq(countries.id, tradeBarriers.countryId))
      .where(gte(tradeBarriers.reportedDate, since.toISOString().slice(0, 10))),
    db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        sourceUrl: newsArticles.sourceUrl,
        countryId: newsArticles.relatedCountryId,
        countryName: countries.name,
        sectorId: products.sectorId,
        sectorName: sectors.name,
      })
      .from(newsArticles)
      .leftJoin(products, eq(products.id, newsArticles.relatedProductId))
      .leftJoin(sectors, eq(sectors.id, products.sectorId))
      .leftJoin(countries, eq(countries.id, newsArticles.relatedCountryId))
      .where(gte(newsArticles.publishedAt, since)),
  ]);

  console.log(
    `${interestRows.length} follows across ${byUser.size} users. ${recentBarriers.length} barriers and ${recentNews.length} news items in the last ${LOOKBACK_HOURS}h.`,
  );

  let emailsSent = 0;
  for (const [userId, interest] of byUser) {
    const matchedBarriers = recentBarriers.filter(
      (b) => (b.sectorId !== null && interest.sectorIds.has(b.sectorId)) || interest.countryIds.has(b.countryId),
    );
    const matchedNews = recentNews.filter(
      (n) =>
        (n.sectorId !== null && interest.sectorIds.has(n.sectorId)) ||
        (n.countryId !== null && interest.countryIds.has(n.countryId)),
    );
    if (matchedBarriers.length === 0 && matchedNews.length === 0) continue;

    const email = emailById.get(userId);
    if (!email) {
      console.log(`  Skipping user ${userId} — no email on file.`);
      continue;
    }

    const { error } = await resend.emails.send({
      from: "KTIP Alerts <onboarding@resend.dev>",
      to: email,
      subject: `KTIP: ${matchedBarriers.length + matchedNews.length} update(s) on your followed interests`,
      html: buildDigestHtml(matchedBarriers, matchedNews),
    });
    // The Resend SDK returns { data, error } rather than throwing on a
    // failed send (e.g. the sandbox-mode "can only send to your own
    // verified address" restriction) — checking this is what tells a
    // real failure apart from a real success, instead of counting every
    // call as sent regardless of what Resend actually did with it.
    if (error) {
      console.log(`  FAILED to send to ${email}: ${error.message}`);
      continue;
    }
    emailsSent++;
    console.log(`  Sent digest to ${email} (${matchedBarriers.length} barriers, ${matchedNews.length} news).`);
  }

  console.log(`Done. Sent ${emailsSent} digest emails.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
