import "../seed/load-env";
import { detectNewBarriers } from "./detect-barriers";
import { detectTariffChanges } from "./detect-tariff-changes";
import { detectOpportunityChanges } from "./detect-opportunity-changes";

/**
 * Master script to run all notification detection jobs
 * This should be run periodically (e.g., daily via cron job or GitHub Actions)
 * 
 * Usage: npx tsx db/notifications/run-all-detections.ts
 * 
 * Add to package.json scripts:
 * "notifications:detect": "tsx db/notifications/run-all-detections.ts"
 */
async function runAllDetections() {
  console.log("=".repeat(60));
  console.log("Running all notification detection jobs...");
  console.log("Started at:", new Date().toISOString());
  console.log("=".repeat(60));

  const results = {
    barriers: 0,
    tariffs: 0,
    opportunities: 0,
    total: 0,
    errors: [] as string[],
  };

  try {
    // 1. Detect new barriers
    console.log("\n[1/3] Detecting new barriers...");
    results.barriers = await detectNewBarriers();
  } catch (error) {
    console.error("Error detecting barriers:", error);
    results.errors.push(`Barriers: ${error}`);
  }

  try {
    // 2. Detect tariff changes
    console.log("\n[2/3] Detecting tariff changes...");
    results.tariffs = await detectTariffChanges();
  } catch (error) {
    console.error("Error detecting tariff changes:", error);
    results.errors.push(`Tariffs: ${error}`);
  }

  try {
    // 3. Detect opportunity score changes
    console.log("\n[3/3] Detecting opportunity score changes...");
    results.opportunities = await detectOpportunityChanges();
  } catch (error) {
    console.error("Error detecting opportunity changes:", error);
    results.errors.push(`Opportunities: ${error}`);
  }

  // Summary
  results.total = results.barriers + results.tariffs + results.opportunities;

  console.log("\n" + "=".repeat(60));
  console.log("Detection Summary:");
  console.log("=".repeat(60));
  console.log(`Barrier notifications:      ${results.barriers}`);
  console.log(`Tariff notifications:       ${results.tariffs}`);
  console.log(`Opportunity notifications:  ${results.opportunities}`);
  console.log("-".repeat(60));
  console.log(`Total notifications:        ${results.total}`);

  if (results.errors.length > 0) {
    console.log("\nErrors encountered:");
    results.errors.forEach((err) => console.log(`  - ${err}`));
  }

  console.log("\nCompleted at:", new Date().toISOString());
  console.log("=".repeat(60));

  return results;
}

// Run if called directly
if (require.main === module) {
  runAllDetections()
    .then((results) => {
      const exitCode = results.errors.length > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { runAllDetections };
