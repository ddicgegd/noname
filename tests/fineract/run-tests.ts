/**
 * Apache Fineract Core Banking — Automated 4-Tier Test Runner
 * Executable via `npx tsx tests/fineract/run-tests.ts`
 */

import { generateSummaryReport } from "./framework";
import { runTier1Tests } from "./tier1-features.test";
import { runTier2Tests } from "./tier2-boundary.test";
import { runTier3Tests } from "./tier3-combinations.test";
import { runTier4Tests } from "./tier4-scenarios.test";

async function main() {
  console.log("\x1b[1m\x1b[36m========================================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m  APACHE FINERACT CORE BANKING & FINANCIAL LEDGER — 4-TIER AUTOMATED TEST RUNNER        \x1b[0m");
  console.log("\x1b[1m\x1b[36m========================================================================================\x1b[0m");
  console.log(`\x1b[90mStarted at: ${new Date().toISOString()}\x1b[0m\n`);

  const startTime = performance.now();

  try {
    // Execute all 4 tiers in sequential progression
    await runTier1Tests();
    await runTier2Tests();
    await runTier3Tests();
    await runTier4Tests();
  } catch (err: any) {
    console.error("\x1b[31m[FATAL] Test Runner encountered unhandled failure:\x1b[0m", err);
    process.exit(1);
  }

  const totalTime = Math.round(performance.now() - startTime);
  const summary = generateSummaryReport();

  // Print ANSI formatted summary table
  console.log("\n\x1b[1m\x1b[37m========================================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[37m                            COMPREHENSIVE TEST RESULTS SUMMARY                          \x1b[0m");
  console.log("\x1b[1m\x1b[37m========================================================================================\x1b[0m");
  console.log("\x1b[1m| Tier   | Description                                          | Pass | Fail | Total | Duration |\x1b[0m");
  console.log("|--------|------------------------------------------------------|------|------|-------|----------|");

  for (const t of summary.tierSummaries) {
    const tierNum = `Tier ${t.tier}`.padEnd(6);
    const desc = t.title.padEnd(52);
    const pass = `\x1b[32m${String(t.passed).padStart(4)}\x1b[0m`;
    const fail = t.failed > 0 ? `\x1b[31m${String(t.failed).padStart(4)}\x1b[0m` : `\x1b[90m${String(t.failed).padStart(4)}\x1b[0m`;
    const total = String(t.total).padStart(5);
    const dur = `${t.durationMs}ms`.padStart(8);
    console.log(`| ${tierNum} | ${desc} | ${pass} | ${fail} | ${total} | ${dur} |`);
  }

  console.log("|--------|------------------------------------------------------|------|------|-------|----------|");
  const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : "0.0";
  console.log(`\n\x1b[1mTotal Tests Executed:\x1b[0m  ${summary.total}`);
  console.log(`\x1b[1mTests Passed:\x1b[0m          \x1b[32m${summary.passed}\x1b[0m`);
  console.log(`\x1b[1mTests Failed:\x1b[0m          ${summary.failed > 0 ? `\x1b[31m${summary.failed}\x1b[0m` : `\x1b[32m${summary.failed}\x1b[0m`}`);
  console.log(`\x1b[1mPass Rate:\x1b[0m             \x1b[1m\x1b[32m${passRate}%\x1b[0m`);
  console.log(`\x1b[1mTotal Execution Time:\x1b[0m  ${totalTime}ms\n`);

  if (summary.failed > 0) {
    console.log("\x1b[1m\x1b[31m❌ TEST SUITE FAILED — Some assertions did not pass specifications.\x1b[0m\n");
    process.exit(1);
  } else {
    console.log("\x1b[1m\x1b[32m✔ ALL 4 TIERS PASSED PERFECTLY (100% SPECIFICATION CONFORMANCE)\x1b[0m\n");
    process.exit(0);
  }
}

main();
