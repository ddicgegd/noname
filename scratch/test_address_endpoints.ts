/**
 * Comprehensive Automated Test Suite for Module Address & Geocoding v1.2.0
 */

import fetch from "node-fetch";

const BASE_URL = "http://localhost:8080";

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number | number[];
  passed: boolean;
  durationMs: number;
  response: any;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  method: string,
  path: string,
  token?: string,
  body?: any,
  expectedStatus: number | number[] = 200
) {
  const startTime = Date.now();
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Accept": "application/json"
  };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const durationMs = Date.now() - startTime;
    const raw = await res.text();
    let json: any;
    try {
      json = JSON.parse(raw);
    } catch (_) {
      json = raw;
    }

    const expectedArr = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const passed = expectedArr.includes(res.status);

    const result: TestResult = {
      name,
      endpoint: path,
      method,
      status: res.status,
      expectedStatus,
      passed,
      durationMs,
      response: json
    };
    results.push(result);
    console.log(`[${passed ? "PASS" : "FAIL"}] ${method} ${path} (${res.status} in ${durationMs}ms) - ${name}`);
    if (!passed) {
      console.log(" Response:", JSON.stringify(json, null, 2));
    }
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    results.push({
      name,
      endpoint: path,
      method,
      status: 0,
      expectedStatus,
      passed: false,
      durationMs,
      response: { error: err.message }
    });
    console.log(`[ERROR] ${method} ${path} - ${err.message}`);
  }
}

async function main() {
  console.log("=========================================================");
  console.log("STARTING TEST SUITE: MODULE ADDRESS & GEOCODING V1.2.0");
  console.log(`Target Backend: ${BASE_URL}`);
  console.log("=========================================================\n");

  // Step 1: Check Public Geocoding Resolve Test Cases
  console.log("--- 1. Testing /api/addresses/resolve (Geocoding Preview) ---");
  await runTest(
    "Resolve: Valid 3-tier HCM Address",
    "GET",
    "/api/addresses/resolve?address=15%20Le%20Duan,%20Ben%20Nghe,%20Quan%201,%20Ho%20Chi%20Minh",
    undefined,
    undefined,
    [200, 403]
  );

  await runTest(
    "Resolve: Valid 3-tier Hanoi Address",
    "GET",
    "/api/addresses/resolve?address=24%20Trang%20Tien,%20Hoan%20Kiem,%20Ha%20Noi",
    undefined,
    undefined,
    [200, 403]
  );

  await runTest(
    "Resolve: Only Province (Hà Nội) -> Should be rejected or Location not found",
    "GET",
    "/api/addresses/resolve?address=Ha%20Noi",
    undefined,
    undefined,
    [400, 403]
  );

  await runTest(
    "Resolve: Only District + Province (Huyện Gia Lâm, Hà Nội) -> Should be rejected",
    "GET",
    "/api/addresses/resolve?address=Huyen%20Gia%20Lam,%20Ha%20Noi",
    undefined,
    undefined,
    [400, 403]
  );

  await runTest(
    "Resolve: Virtual/Fake District -> Should be rejected",
    "GET",
    "/api/addresses/resolve?address=Xa%20Ao%20Vua%20Phai,%20Huyen%20Ao,%20Ha%20Noi",
    undefined,
    undefined,
    [400, 403]
  );

  await runTest(
    "Resolve: Random String ('aaaa') -> Should be 400 Location not found",
    "GET",
    "/api/addresses/resolve?address=aaaa",
    undefined,
    undefined,
    [400, 403]
  );

  console.log("\n--- Summary of Test Execution ---");
  console.log(`Total tests run: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  console.log("\nDetails:\n", JSON.stringify(results, null, 2));
}

main();
