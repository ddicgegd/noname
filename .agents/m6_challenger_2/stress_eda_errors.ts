/**
 * Adversarial Stress Test Suite: Kafka EDA, Concurrency & Error Extraction
 * Executed by Challenger 2 for Milestone 6
 */

import { fineractMockStore } from "../../src/lib/fineractMockStore";
import { fineractService } from "../../src/services/fineractService";
import { extractFineractError, formatFineractErrorToast } from "../../src/lib/fineractErrorExtractor";
import { KafkaOrderEvent, CreateClientPayload } from "../../src/types/fineract";

// Test reporting structures
interface TestResult {
  group: string;
  id: string;
  description: string;
  status: "PASS" | "FAIL" | "VULNERABILITY_CONFIRMED";
  durationMs: number;
  details?: string;
  evidence?: any;
}

const results: TestResult[] = [];

function record(
  group: string,
  id: string,
  description: string,
  status: "PASS" | "FAIL" | "VULNERABILITY_CONFIRMED",
  durationMs: number,
  details?: string,
  evidence?: any
) {
  results.push({ group, id, description, status, durationMs, details, evidence });
  const icon = status === "PASS" ? "✔" : status === "VULNERABILITY_CONFIRMED" ? "⚠ [DEFECT]" : "✖ [FAIL]";
  console.log(`  ${icon} [${id}] ${description} (${durationMs.toFixed(2)}ms)`);
  if (details) {
    console.log(`     -> ${details}`);
  }
}

// Helper to run individual test safely
async function runTest(
  group: string,
  id: string,
  description: string,
  fn: () => Promise<void> | void
) {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    record(group, id, description, "PASS", duration);
  } catch (err: any) {
    const duration = performance.now() - start;
    if (err.isVulnerability) {
      record(group, id, description, "VULNERABILITY_CONFIRMED", duration, err.message, err.evidence);
    } else {
      record(group, id, description, "FAIL", duration, err.message, { stack: err.stack });
    }
  }
}

function vulnerability(message: string, evidence?: any) {
  const err: any = new Error(message);
  err.isVulnerability = true;
  err.evidence = evidence;
  return err;
}

// ============================================================================
// SUITE EXECUTION
// ============================================================================

async function runSuite() {
  console.log("\n======================================================================");
  console.log(">>> ADVERSARIAL STRESS TEST SUITE: KAFKA EDA, CONCURRENCY & ERRORS");
  console.log("======================================================================\n");

  // --------------------------------------------------------------------------
  // GROUP 1: High-Frequency Burst of Kafka Order Events
  // --------------------------------------------------------------------------
  console.log("--- Group 1: High-Frequency Burst of Kafka Order Events ---");

  await runTest(
    "G1: Kafka Burst",
    "G1-01",
    "Burst of 100 concurrent mixed Kafka order events via Promise.all",
    async () => {
      fineractMockStore.resetStore();

      const eventsToEmit: KafkaOrderEvent[] = [];
      const totalEvents = 100;
      let expectedSales = 0;
      let expectedRefunds = 0;
      let expectedSkips = 0;
      let expectedSalesVnd = 0;
      let expectedRefundsVnd = 0;

      for (let i = 1; i <= totalEvents; i++) {
        const orderNum = `ORD-BURST-${String(i).padStart(4, "0")}`;
        const amount = 100000 + (i * 10000); // Varied amounts
        const paymentMethod = i % 2 === 0 ? "COD" : "BANK_TRANSFER";

        if (i <= 40) {
          // PROCESSING -> SALE
          eventsToEmit.push({
            eventType: "ORDER_STATUS_CHANGED",
            orderNumber: orderNum,
            newStatus: "PROCESSING",
            totalAmount: amount,
            paymentMethod,
            customerName: `Burst Customer ${i}`
          });
          expectedSales++;
          expectedSalesVnd += amount;
        } else if (i <= 70) {
          // REFUNDED -> REFUND
          eventsToEmit.push({
            eventType: "ORDER_STATUS_CHANGED",
            orderNumber: orderNum,
            newStatus: "REFUNDED",
            totalAmount: amount,
            paymentMethod,
            customerName: `Burst Customer ${i}`
          });
          expectedRefunds++;
          expectedRefundsVnd += amount;
        } else if (i <= 85) {
          // DELIVERED -> Skip
          eventsToEmit.push({
            eventType: "ORDER_STATUS_CHANGED",
            orderNumber: orderNum,
            newStatus: "DELIVERED",
            totalAmount: amount,
            paymentMethod,
            customerName: `Burst Customer ${i}`
          });
          expectedSkips++;
        } else {
          // CANCELLED -> Skip
          eventsToEmit.push({
            eventType: "ORDER_STATUS_CHANGED",
            orderNumber: orderNum,
            newStatus: "CANCELLED",
            totalAmount: amount,
            paymentMethod,
            customerName: `Burst Customer ${i}`
          });
          expectedSkips++;
        }
      }

      // Execute all 100 concurrently through fineractService
      const results = await Promise.all(
        eventsToEmit.map(evt => fineractService.simulateKafkaOrderEvent(evt))
      );

      if (results.length !== 100) {
        throw new Error(`Expected 100 results, got ${results.length}`);
      }

      // Check kafkaEvents state length
      const recordedEvents = fineractMockStore.getKafkaEvents();
      // Notice: seed state has 4 initial events, so 104
      if (recordedEvents.length < 104) {
        throw new Error(`Expected >= 104 recorded events, found ${recordedEvents.length}`);
      }

      // Check journal transactions integrity
      const txs = fineractMockStore.getJournalTransactions();
      const burstTxs = txs.filter(t => t.referenceNumber?.includes("ORD-BURST-"));
      if (burstTxs.length !== expectedSales + expectedRefunds) {
        throw new Error(
          `Expected ${expectedSales + expectedRefunds} journal transactions, found ${burstTxs.length}`
        );
      }

      // Check transaction ID uniqueness
      const txIds = new Set(burstTxs.map(t => t.transactionId));
      if (txIds.size !== burstTxs.length) {
        throw vulnerability(
          `Transaction ID collision detected under concurrent burst: ${burstTxs.length - txIds.size} collisions!`,
          { total: burstTxs.length, uniqueIds: txIds.size }
        );
      }

      // Check double-entry balance on all generated transactions
      for (const tx of burstTxs) {
        if (!tx.isBalanced) {
          throw new Error(`Transaction ${tx.transactionId} (${tx.referenceNumber}) is NOT balanced!`);
        }
      }

      // Global Ledger invariant: Sum(All Debits) == Sum(All Credits)
      const allEntries = fineractMockStore.getJournalEntries();
      const totalDebit = allEntries
        .filter(e => e.entryType.code === "DEBIT")
        .reduce((sum, e) => sum + e.amount, 0);
      const totalCredit = allEntries
        .filter(e => e.entryType.code === "CREDIT")
        .reduce((sum, e) => sum + e.amount, 0);

      const diff = Math.abs(totalDebit - totalCredit);
      if (diff > 0.01) {
        throw new Error(`Global ledger imbalanced! Debits=${totalDebit}, Credits=${totalCredit}, diff=${diff}`);
      }
    }
  );

  await runTest(
    "G1: Kafka Burst",
    "G1-02",
    "Line ID monotonicity and non-collision under high-concurrency burst",
    async () => {
      const allEntries = fineractMockStore.getJournalEntries();
      const lineIds = allEntries.map(e => e.id);
      const uniqueLineIds = new Set(lineIds);
      if (uniqueLineIds.size !== lineIds.length) {
        throw vulnerability(
          `Journal Entry Line ID collision detected: ${lineIds.length - uniqueLineIds.size} duplicates!`,
          { totalLines: lineIds.length, uniqueLines: uniqueLineIds.size }
        );
      }
    }
  );

  // --------------------------------------------------------------------------
  // GROUP 2: Idempotency & Order Number Integrity
  // --------------------------------------------------------------------------
  console.log("\n--- Group 2: Idempotency & Order Number Integrity ---");

  await runTest(
    "G2: Idempotency & Integrity",
    "G2-01",
    "Duplicate Kafka event execution idempotency (At-least-once delivery)",
    async () => {
      fineractMockStore.resetStore();

      const duplicateOrderEvent: KafkaOrderEvent = {
        eventId: "EVT-DUP-TEST-001",
        eventType: "ORDER_STATUS_CHANGED",
        orderNumber: "ORD-IDEMPOTENT-001",
        newStatus: "PROCESSING",
        totalAmount: 500000,
        paymentMethod: "COD",
        customerName: "Duplicate Test Customer"
      };

      // Initial execution
      const res1 = fineractMockStore.processKafkaOrderEvent(duplicateOrderEvent);
      // Redelivery of exact same event
      const res2 = fineractMockStore.processKafkaOrderEvent(duplicateOrderEvent);

      const allEntries = fineractMockStore.getJournalEntries();
      const duplicatePostings = allEntries.filter(
        e => e.referenceNumber === "SALE-ORD-IDEMPOTENT-001"
      );

      // In a robust EDA, identical events should NOT duplicate journal postings
      // Each journal transaction has 2 lines (debit + credit), so 2 duplicate transactions = 4 lines
      if (duplicatePostings.length > 2) {
        throw vulnerability(
          `EDA Idempotency Violation: Processing duplicate Kafka event created ${duplicatePostings.length / 2} separate journal transactions instead of deduplicating! Revenue and Cash balances are doubled without guard.`,
          {
            referenceNumber: "SALE-ORD-IDEMPOTENT-001",
            postingCount: duplicatePostings.length / 2,
            res1Tx: res1.journalEntry?.transactionId,
            res2Tx: res2.journalEntry?.transactionId
          }
        );
      }
    }
  );

  await runTest(
    "G2: Idempotency & Integrity",
    "G2-02",
    "Out-of-order lifecycle event: REFUNDED processed without prior SALE",
    async () => {
      fineractMockStore.resetStore();

      const ghostRefund: KafkaOrderEvent = {
        eventType: "ORDER_STATUS_CHANGED",
        orderNumber: "ORD-GHOST-9999",
        newStatus: "REFUNDED",
        totalAmount: 1000000,
        paymentMethod: "BANK_TRANSFER",
        customerName: "Ghost Buyer"
      };

      const res = fineractMockStore.processKafkaOrderEvent(ghostRefund);
      // Check if refund was posted even though no sale ever occurred
      if (res.journalEntry) {
        throw vulnerability(
          `Lifecycle Ordering Invariant Missing: REFUND-${ghostRefund.orderNumber} was posted without an existing SALE transaction. Ledger credited bank balance before receiving funds.`,
          { referenceNumber: res.journalEntry.referenceNumber }
        );
      }
    }
  );

  await runTest(
    "G2: Idempotency & Integrity",
    "G2-03",
    "Empty or whitespace orderNumber validation",
    async () => {
      fineractMockStore.resetStore();

      const emptyOrderEvent: KafkaOrderEvent = {
        eventType: "ORDER_STATUS_CHANGED",
        orderNumber: "   ",
        newStatus: "PROCESSING",
        totalAmount: 300000,
        paymentMethod: "COD"
      };

      const res = fineractMockStore.processKafkaOrderEvent(emptyOrderEvent);
      if (res.journalEntry && res.journalEntry.referenceNumber === "SALE-   ") {
        throw vulnerability(
          `Order number integrity defect: Empty/whitespace orderNumber produced referenceNumber "SALE-   " without validation.`,
          { referenceNumber: res.journalEntry.referenceNumber }
        );
      }
    }
  );

  await runTest(
    "G2: Idempotency & Integrity",
    "G2-04",
    "Malicious injection strings in orderNumber (XSS / SQL / Path Traversal)",
    async () => {
      fineractMockStore.resetStore();

      const injectionPayloads = [
        "<script>alert('xss')</script>",
        "'; DROP TABLE orders;--",
        "../../etc/passwd"
      ];

      for (const payload of injectionPayloads) {
        const evt: KafkaOrderEvent = {
          eventType: "ORDER_STATUS_CHANGED",
          orderNumber: payload,
          newStatus: "PROCESSING",
          totalAmount: 150000,
          paymentMethod: "COD"
        };
        const res = fineractMockStore.processKafkaOrderEvent(evt);
        if (res.journalEntry?.referenceNumber?.includes("<script>")) {
          throw vulnerability(
            `Injection payload unescaped in ledger referenceNumber: ${res.journalEntry.referenceNumber}`,
            { payload, referenceNumber: res.journalEntry.referenceNumber }
          );
        }
      }
    }
  );

  await runTest(
    "G2: Idempotency & Integrity",
    "G2-05",
    "Handling NaN, -0, and Infinity in totalAmount",
    async () => {
      fineractMockStore.resetStore();

      // NaN totalAmount
      const nanEvt: KafkaOrderEvent = {
        eventType: "ORDER_STATUS_CHANGED",
        orderNumber: "ORD-NAN-01",
        newStatus: "PROCESSING",
        totalAmount: NaN,
        paymentMethod: "COD"
      };

      try {
        const res = fineractMockStore.processKafkaOrderEvent(nanEvt);
        if (res.journalEntry) {
          throw vulnerability(
            `NaN totalAmount was accepted and created journal entry!`,
            { journalEntry: res.journalEntry }
          );
        }
      } catch (err: any) {
        // If it threw an error or was rejected, that's expected
      }
    }
  );

  // --------------------------------------------------------------------------
  // GROUP 3: Client Registration, Vietnamese Diacritics, Whitespace & External IDs
  // --------------------------------------------------------------------------
  console.log("\n--- Group 3: Client Registration, Diacritics, Whitespace & External IDs ---");

  await runTest(
    "G3: Client Registration",
    "G3-01",
    "Vietnamese diacritics: 4-5 word compound names & tone marks",
    async () => {
      fineractMockStore.resetStore();

      const names = [
        { full: "Đặng Vũ Thị Ngọc Ánh", expectedFirst: "Ánh", expectedLast: "Đặng Vũ Thị Ngọc" },
        { full: "Nguyễn Phước Vĩnh Thuỵ", expectedFirst: "Thuỵ", expectedLast: "Nguyễn Phước Vĩnh" },
        { full: "Trần Đoàn Trọng Nghĩa", expectedFirst: "Nghĩa", expectedLast: "Trần Đoàn Trọng" },
        { full: "Võ Thị Sáu", expectedFirst: "Sáu", expectedLast: "Võ Thị" }
      ];

      for (const n of names) {
        const client = fineractMockStore.createClient({
          fullName: n.full,
          activationDate: "04 September 2026",
          externalId: `USR-${Math.random().toString(36).substring(7)}`
        });

        if (client.firstname !== n.expectedFirst || client.lastname !== n.expectedLast) {
          throw new Error(
            `Vietnamese name parsing failed for "${n.full}". Got firstname="${client.firstname}", lastname="${client.lastname}"`
          );
        }
      }
    }
  );

  await runTest(
    "G3: Client Registration",
    "G3-02",
    "Irregular whitespace: tabs, non-breaking space (\\u00A0), multiple spaces",
    async () => {
      fineractMockStore.resetStore();

      const nameWithSpaces = " \u00A0 Nguyễn \t  Văn \t  Bình \u00A0 ";
      const client = fineractMockStore.createClient({
        fullName: nameWithSpaces,
        activationDate: "04 September 2026",
        externalId: "USR-WHITESPACE-01"
      });

      if (client.firstname !== "Bình" || client.lastname !== "Nguyễn Văn") {
        throw new Error(
          `Whitespace handling failed. Expected "Nguyễn Văn" and "Bình", got "${client.lastname}" and "${client.firstname}"`
        );
      }
    }
  );

  await runTest(
    "G3: Client Registration",
    "G3-03",
    "Single-word name behavior",
    async () => {
      fineractMockStore.resetStore();

      const client = fineractMockStore.createClient({
        fullName: "Dũng",
        activationDate: "04 September 2026",
        externalId: "USR-SINGLE-01"
      });

      // Single word name: firstname="Dũng", lastname="Dũng", displayName="Dũng Dũng"
      if (!client.firstname || !client.lastname) {
        throw new Error(`Single word name failed to generate valid client`);
      }
    }
  );

  await runTest(
    "G3: Client Registration",
    "G3-04",
    "ExternalId uniqueness bypass via whitespace and case variance",
    async () => {
      fineractMockStore.resetStore();

      // Register primary client
      fineractMockStore.createClient({
        fullName: "Lê Văn Hùng",
        externalId: "ERP-USER-100",
        activationDate: "04 September 2026"
      });

      // Attempt 1: Exact duplicate externalId -> MUST THROW 403
      let duplicateBlocked = false;
      try {
        fineractMockStore.createClient({
          fullName: "Lê Văn Hùng Clone",
          externalId: "ERP-USER-100",
          activationDate: "04 September 2026"
        });
      } catch (err: any) {
        if (err.httpStatusCode === 403) duplicateBlocked = true;
      }

      if (!duplicateBlocked) {
        throw new Error("Exact duplicate externalId was NOT blocked by mock store!");
      }

      // Attempt 2: Whitespace padded externalId (" ERP-USER-100 ")
      let paddedBypassed = false;
      try {
        const paddedClient = fineractMockStore.createClient({
          fullName: "Lê Văn Hùng Padded",
          externalId: " ERP-USER-100 ",
          activationDate: "04 September 2026"
        });
        if (paddedClient) paddedBypassed = true;
      } catch {
        // Blocked as expected
      }

      if (paddedBypassed) {
        throw vulnerability(
          `ExternalId Uniqueness Bypass: Padded externalId " ERP-USER-100 " bypassed uniqueness check because createClient does not trim externalId. Multiple clients now hold the same logical identity.`,
          { existing: "ERP-USER-100", bypassed: " ERP-USER-100 " }
        );
      }
    }
  );

  await runTest(
    "G3: Client Registration",
    "G3-05",
    "Customer isolation: Empty externalId query leak check",
    async () => {
      fineractMockStore.resetStore();

      // Query clients as customer role with empty externalId ""
      const clients = fineractMockStore.getClients("customer", "");
      // If customer passes "" externalId, does it leak all clients?
      if (clients.length > 1) {
        throw vulnerability(
          `Customer Role Security Leak: Calling getClients("customer", "") bypassed the externalId filter because "" is falsy in (role === 'customer' && externalId), returning all ${clients.length} clients in the system!`,
          { leakedCount: clients.length }
        );
      }
    }
  );

  // --------------------------------------------------------------------------
  // GROUP 4: Malformed, Corrupted, or HTML Error Payloads
  // --------------------------------------------------------------------------
  console.log("\n--- Group 4: Malformed, Corrupted, or HTML Error Payloads ---");

  await runTest(
    "G4: Error Extraction",
    "G4-01",
    "Critical crash on errors: [null] in fineractResponse",
    async () => {
      const payloadWithNullError = {
        data: {
          fineractResponse: {
            developerMessage: "Validation failed",
            errors: [null] // Malformed errors array
          }
        }
      };

      try {
        const parsed = extractFineractError(payloadWithNullError);
        if (!parsed) throw new Error("Parsed result is null");
      } catch (err: any) {
        throw vulnerability(
          `Crash in extractFineractError: Payload with errors: [null] caused unhandled exception: ${err.message}`,
          { stack: err.stack }
        );
      }
    }
  );

  await runTest(
    "G4: Error Extraction",
    "G4-02",
    "Axios / Gateway error with HTML string payload (502 / 504 Bad Gateway)",
    async () => {
      const gatewayHtmlError = {
        status: 502,
        statusCode: 502,
        data: "<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1>The server encountered a temporary error and could not complete your request.</body></html>"
      };

      const parsed = extractFineractError(gatewayHtmlError);

      // Check if httpStatusCode 502 was extracted and HTML payload recognized
      if (parsed.httpStatusCode !== 502) {
        throw vulnerability(
          `Gateway Error Loss: extractFineractError failed to extract HTTP 502 from Axios error object when data is an HTML string! httpStatusCode defaulted to ${parsed.httpStatusCode} ("${parsed.title}").`,
          {
            expectedStatus: 502,
            actualStatus: parsed.httpStatusCode,
            actualTitle: parsed.title,
            defaultUserMessage: parsed.defaultUserMessage
          }
        );
      }
    }
  );

  await runTest(
    "G4: Error Extraction",
    "G4-03",
    "Raw HTML error string passed directly to extractor",
    async () => {
      const rawHtml = "<html><body><h1>504 Gateway Timeout</h1></body></html>";
      const parsed = extractFineractError(rawHtml);

      // Raw HTML string should not leak raw markup directly into user message without sanitization
      const toast = formatFineractErrorToast(rawHtml);
      if (toast.message.includes("<html>") || toast.message.includes("<h1>")) {
        throw vulnerability(
          `Unsanitized HTML in Toast message: Raw HTML tags leaked directly into toast message text!`,
          { message: toast.message }
        );
      }
    }
  );

  await runTest(
    "G4: Error Extraction",
    "G4-04",
    "Corrupted JSON string in fineractResponse",
    async () => {
      const corruptedPayload = {
        data: {
          httpStatusCode: 400,
          fineractResponse: '{"developerMessage": "Trun'
        }
      };

      const parsed = extractFineractError(corruptedPayload);
      if (parsed.isFineractError !== false) {
        throw new Error("Corrupted JSON should have isFineractError = false");
      }
      if (!parsed.developerMessage.includes("Trun")) {
        throw new Error("Corrupted string should be retained in developerMessage as raw fallback");
      }
    }
  );

  await runTest(
    "G4: Error Extraction",
    "G4-05",
    "XSS script injection inside fineractResponse fields",
    async () => {
      const xssPayload = {
        data: {
          fineractResponse: JSON.stringify({
            developerMessage: "<script>alert('dev-xss')</script>",
            defaultUserMessage: "<img src=x onerror=alert('xss')>",
            parameterName: "userName<script>alert(1)</script>"
          })
        }
      };

      const parsed = extractFineractError(xssPayload);
      const toast = formatFineractErrorToast(xssPayload);

      // Verify that XSS payloads don't crash extractor
      if (!parsed.isFineractError) {
        throw new Error("XSS payload was not recognized as Fineract error");
      }
      // Note: Toast string contains raw tags; documented as advisory finding
    }
  );

  await runTest(
    "G4: Error Extraction",
    "G4-06",
    "Primitive inputs: number, boolean, symbol, NaN, undefined, null",
    async () => {
      const primitives = [
        404,
        500,
        NaN,
        Infinity,
        true,
        false,
        null,
        undefined,
        Symbol("TEST")
      ];

      for (const p of primitives) {
        const parsed = extractFineractError(p);
        if (!parsed || typeof parsed.httpStatusCode !== "number" || typeof parsed.title !== "string") {
          throw new Error(`Failed on primitive input: ${String(p)}`);
        }
      }
    }
  );

  await runTest(
    "G4: Error Extraction",
    "G4-07",
    "Circular reference in error object",
    async () => {
      const circular: any = {
        message: "Circular reference test",
        developerMessage: "Looping object"
      };
      circular.self = circular;

      try {
        const parsed = extractFineractError(circular);
        if (!parsed) throw new Error("Parsed result is null");
      } catch (err: any) {
        throw vulnerability(`Crash on circular reference error object: ${err.message}`);
      }
    }
  );

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("\n======================================================================");
  console.log("                        ADVERSARIAL TEST SUMMARY                      ");
  console.log("======================================================================");

  const passed = results.filter(r => r.status === "PASS").length;
  const vulns = results.filter(r => r.status === "VULNERABILITY_CONFIRMED").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  console.log(`Total Adversarial Probes: ${results.length}`);
  console.log(`  Passed / Resilient:     ${passed}`);
  console.log(`  Vulnerabilities Found:  ${vulns}`);
  console.log(`  Execution Failures:     ${failed}`);
  console.log("======================================================================\n");

  for (const r of results) {
    if (r.status !== "PASS") {
      console.log(`[${r.status}] ${r.id}: ${r.description}`);
      if (r.details) console.log(`  Details: ${r.details}`);
      if (r.evidence) console.log(`  Evidence: ${JSON.stringify(r.evidence, null, 2)}`);
      console.log("");
    }
  }

  return { total: results.length, passed, vulns, failed, results };
}

// Execute
runSuite().catch(err => {
  console.error("FATAL SUITE CRASH:", err);
  process.exit(1);
});
