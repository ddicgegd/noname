/**
 * Lightweight, zero-dependency, high-density test harness for Apache Fineract integration.
 * Supports synchronous and asynchronous tests, descriptive matchers, and 4-tier reporting.
 */

export type TierLevel = 1 | 2 | 3 | 4;

export interface TestResult {
  tier: TierLevel;
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error | any;
}

export interface TierSummary {
  tier: TierLevel;
  title: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

class TestContext {
  private currentTier: TierLevel = 1;
  private currentSuite: string = "Default Suite";
  private results: TestResult[] = [];
  private beforeAllHooks: Array<() => Promise<void> | void> = [];
  private beforeEachHooks: Array<() => Promise<void> | void> = [];

  setContext(tier: TierLevel, suite: string) {
    this.currentTier = tier;
    this.currentSuite = suite;
  }

  addBeforeAll(fn: () => Promise<void> | void) {
    this.beforeAllHooks.push(fn);
  }

  addBeforeEach(fn: () => Promise<void> | void) {
    this.beforeEachHooks.push(fn);
  }

  async runBeforeAll() {
    for (const hook of this.beforeAllHooks) {
      await hook();
    }
  }

  async runBeforeEach() {
    for (const hook of this.beforeEachHooks) {
      await hook();
    }
  }

  recordResult(result: TestResult) {
    this.results.push(result);
  }

  getResults(): TestResult[] {
    return this.results;
  }

  clear() {
    this.results = [];
    this.beforeAllHooks = [];
    this.beforeEachHooks = [];
  }
}

export const context = new TestContext();

export function setTestTier(tier: TierLevel, suite: string) {
  context.setContext(tier, suite);
}

export function beforeEach(fn: () => Promise<void> | void) {
  context.addBeforeEach(fn);
}

export async function test(name: string, fn: () => Promise<void> | void, tierOverride?: TierLevel) {
  const currentTier = tierOverride ?? (context as any).currentTier;
  const currentSuite = (context as any).currentSuite;
  const start = performance.now();
  let passed = true;
  let caughtError: any = undefined;

  try {
    await context.runBeforeEach();
    await fn();
  } catch (err: any) {
    passed = false;
    caughtError = err;
  }

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  const result: TestResult = {
    tier: currentTier,
    suite: currentSuite,
    name,
    passed,
    durationMs,
    error: caughtError,
  };

  context.recordResult(result);

  const icon = passed ? "\x1b[32m✔\x1b[0m" : "\x1b[31m✖\x1b[0m";
  const tierTag = `\x1b[36m[T${currentTier}]\x1b[0m`;
  if (passed) {
    console.log(`  ${icon} ${tierTag} ${name} \x1b[90m(${durationMs}ms)\x1b[0m`);
  } else {
    console.error(`  ${icon} ${tierTag} \x1b[31m${name}\x1b[0m \x1b[90m(${durationMs}ms)\x1b[0m`);
    console.error(`     \x1b[31mError:\x1b[0m ${caughtError?.message || caughtError}`);
    if (caughtError?.stack && process.env.VERBOSE) {
      console.error(`     \x1b[90m${caughtError.stack.split("\n").slice(1, 4).join("\n     ")}\x1b[0m`);
    }
  }
}

export class Matcher<T> {
  constructor(private actual: T, private isNegative: boolean = false) {}

  get not(): Matcher<T> {
    return new Matcher(this.actual, !this.isNegative);
  }

  toBe(expected: any) {
    const matches = Object.is(this.actual, expected);
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNegative ? "not to be" : "to be"} ${JSON.stringify(expected)}`);
    }
  }

  toEqual(expected: any) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    const matches = actualStr === expectedStr;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected deep equality.\n  Actual:   ${actualStr}\n  Expected: ${expectedStr}`);
    }
  }

  toBeCloseTo(expected: number, precision: number = 0.001) {
    const diff = Math.abs((this.actual as unknown as number) - expected);
    const matches = diff < precision;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} to be within ${precision} of ${expected} (diff: ${diff})`);
    }
  }

  toBeGreaterThan(expected: number) {
    const matches = (this.actual as unknown as number) > expected;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} to be > ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected: number) {
    const matches = (this.actual as unknown as number) >= expected;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} to be >= ${expected}`);
    }
  }

  toBeLessThan(expected: number) {
    const matches = (this.actual as unknown as number) < expected;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} to be < ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected: number) {
    const matches = (this.actual as unknown as number) <= expected;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} to be <= ${expected}`);
    }
  }

  toBeTruthy() {
    const matches = Boolean(this.actual);
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} ${this.isNegative ? "not to be" : "to be"} truthy`);
    }
  }

  toBeFalsy() {
    const matches = !Boolean(this.actual);
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} ${this.isNegative ? "not to be" : "to be"} falsy`);
    }
  }

  toBeNull() {
    const matches = this.actual === null;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${this.actual} ${this.isNegative ? "not to be" : "to be"} null`);
    }
  }

  toBeDefined() {
    const matches = this.actual !== undefined;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected value ${this.isNegative ? "not to be" : "to be"} defined`);
    }
  }

  toBeUndefined() {
    const matches = this.actual === undefined;
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected value ${this.isNegative ? "not to be" : "to be"} undefined`);
    }
  }

  toContain(item: any) {
    let matches = false;
    if (typeof this.actual === "string") {
      matches = this.actual.includes(String(item));
    } else if (Array.isArray(this.actual)) {
      matches = this.actual.includes(item);
    }
    if (this.isNegative ? matches : !matches) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNegative ? "not to contain" : "to contain"} ${JSON.stringify(item)}`);
    }
  }

  toThrow(expectedMessageOrRegex?: string | RegExp) {
    if (typeof this.actual !== "function") {
      throw new Error("expect(fn).toThrow requires a function");
    }

    let threw = false;
    let caughtError: any = null;
    try {
      (this.actual as any)();
    } catch (err: any) {
      threw = true;
      caughtError = err;
    }

    if (!threw) {
      throw new Error("Expected function to throw an error, but it did not.");
    }

    if (expectedMessageOrRegex) {
      const msg = caughtError?.message || String(caughtError);
      if (typeof expectedMessageOrRegex === "string") {
        if (!msg.includes(expectedMessageOrRegex)) {
          throw new Error(`Expected error message to include "${expectedMessageOrRegex}", got "${msg}"`);
        }
      } else if (expectedMessageOrRegex instanceof RegExp) {
        if (!expectedMessageOrRegex.test(msg)) {
          throw new Error(`Expected error message to match ${expectedMessageOrRegex}, got "${msg}"`);
        }
      }
    }
  }

  get rejects(): {
    toThrow: (expectedMessageOrRegex?: string | RegExp) => Promise<void>;
  } {
    return {
      toThrow: async (expectedMessageOrRegex?: string | RegExp) => {
        let threw = false;
        let caughtError: any = null;
        try {
          if (typeof this.actual === "function") {
            await (this.actual as any)();
          } else {
            await (this.actual as Promise<any>);
          }
        } catch (err: any) {
          threw = true;
          caughtError = err;
        }

        if (!threw) {
          throw new Error("Expected promise/async function to reject/throw, but it resolved.");
        }

        if (expectedMessageOrRegex) {
          const msg = caughtError?.message || String(caughtError);
          if (typeof expectedMessageOrRegex === "string") {
            if (!msg.includes(expectedMessageOrRegex)) {
              throw new Error(`Expected rejection message to include "${expectedMessageOrRegex}", got "${msg}"`);
            }
          } else if (expectedMessageOrRegex instanceof RegExp) {
            if (!expectedMessageOrRegex.test(msg)) {
              throw new Error(`Expected rejection message to match ${expectedMessageOrRegex}, got "${msg}"`);
            }
          }
        }
      },
    };
  }
}

export function expect<T>(actual: T): Matcher<T> {
  return new Matcher(actual);
}

export function generateSummaryReport(): {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  tierSummaries: TierSummary[];
} {
  const results = context.getResults();
  const tierTitles: Record<TierLevel, string> = {
    1: "Tier 1: Feature Coverage (>=5 tests / feature)",
    2: "Tier 2: Boundary & Corner Cases (>=5 tests / feature)",
    3: "Tier 3: Cross-Feature Combinations (pairwise interactions)",
    4: "Tier 4: Real-World Application Scenarios (end-to-end flows)",
  };

  const tierSummaries: TierSummary[] = ([1, 2, 3, 4] as TierLevel[]).map((tier) => {
    const tierResults = results.filter((r) => r.tier === tier);
    return {
      tier,
      title: tierTitles[tier],
      total: tierResults.length,
      passed: tierResults.filter((r) => r.passed).length,
      failed: tierResults.filter((r) => !r.passed).length,
      durationMs: tierResults.reduce((acc, r) => acc + r.durationMs, 0),
    };
  });

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const durationMs = results.reduce((acc, r) => acc + r.durationMs, 0);

  return { total, passed, failed, durationMs, tierSummaries };
}
