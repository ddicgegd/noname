import assert from "node:assert/strict";
import { STORAGE_KEYS } from "./storageKeys";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  pingEndpoint,
} from "./api";

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

class MockCustomEvent<T = unknown> extends Event {
  readonly detail: T;

  constructor(type: string, init?: CustomEventInit<T>) {
    super(type, init);
    this.detail = init?.detail as T;
  }
}

class MockWindow extends EventTarget {
  readonly localStorage: Storage;

  constructor(storage: Storage) {
    super();
    this.localStorage = storage;
  }
}

async function runTests() {
  console.log("=== BẮT ĐẦU CHẠY TDD API ENDPOINT SUITE ===");

  // 1. Kiểm tra STORAGE_KEYS
  console.log("[TEST 1] STORAGE_KEYS.CUSTOM_API_BASE_URL phải được định nghĩa");
  assert.equal(
    STORAGE_KEYS.CUSTOM_API_BASE_URL,
    "custom_api_base_url",
    "STORAGE_KEYS.CUSTOM_API_BASE_URL phải có giá trị 'custom_api_base_url'"
  );
  console.log("-> PASS: STORAGE_KEYS.CUSTOM_API_BASE_URL chính xác");

  // Mock global window & localStorage
  const mockStorage = new MockStorage();
  const mockWindow = new MockWindow(mockStorage);

  const globalScope = globalThis as unknown as {
    window: unknown;
    localStorage: Storage;
    CustomEvent: typeof CustomEvent;
    Event: typeof Event;
    fetch: typeof fetch;
  };

  globalScope.window = mockWindow;
  globalScope.localStorage = mockStorage;
  globalScope.CustomEvent = MockCustomEvent as unknown as typeof CustomEvent;
  globalScope.Event = Event;

  // 2. getApiBaseUrl() fallback
  console.log("[TEST 2] getApiBaseUrl() trả về URL fallback mặc định khi chưa cấu hình");
  mockStorage.clear();
  const defaultUrl = getApiBaseUrl();
  assert.equal(defaultUrl, "http://localhost:8080", "Mặc định trả về http://localhost:8080");
  console.log("-> PASS: Fallback URL chính xác");

  // 3. setApiBaseUrl() validation
  console.log("[TEST 3] setApiBaseUrl() ném lỗi khi URL không hợp lệ hoặc sai protocol");
  assert.throws(
    () => setApiBaseUrl("invalid-endpoint"),
    /Invalid endpoint URL/,
    "Phải ném lỗi khi URL không parse được"
  );
  assert.throws(
    () => setApiBaseUrl("ftp://my-server.com"),
    /Invalid endpoint URL: protocol must be http or https/,
    "Phải ném lỗi khi protocol không phải http/https"
  );
  assert.throws(
    () => setApiBaseUrl("ws://localhost:8080"),
    /Invalid endpoint URL: protocol must be http or https/,
    "Phải ném lỗi khi protocol là ws"
  );
  console.log("-> PASS: Bắt lỗi validation thành công");

  // 4. setApiBaseUrl() chuẩn hóa, lưu localStorage và phát event
  console.log("[TEST 4] setApiBaseUrl() chuẩn hóa URL và phát các sự kiện đồng bộ");
  let storageEventFired = false;
  let customEventDetail: unknown = null;

  mockWindow.addEventListener("storage", () => {
    storageEventFired = true;
  });
  mockWindow.addEventListener("api-base-url-changed", (event: Event) => {
    const customEvent = event as CustomEvent<{ url: string }>;
    customEventDetail = customEvent.detail;
  });

  setApiBaseUrl("  https://api.example.com:8443///  ");
  assert.equal(
    mockStorage.getItem(STORAGE_KEYS.CUSTOM_API_BASE_URL),
    "https://api.example.com:8443",
    "URL phải được trim và loại bỏ trailing slashes"
  );
  assert.equal(getApiBaseUrl(), "https://api.example.com:8443");
  assert.equal(storageEventFired, true, "Sự kiện storage phải được dispatch");
  assert.deepEqual(
    customEventDetail,
    { url: "https://api.example.com:8443" },
    "CustomEvent phải mang detail URL mới"
  );
  console.log("-> PASS: setApiBaseUrl hoạt động chuẩn xác");

  // 5. resetApiBaseUrl() xóa storage và revert về mặc định
  console.log("[TEST 5] resetApiBaseUrl() xóa storage và phát sự kiện đồng bộ");
  storageEventFired = false;
  customEventDetail = null;

  resetApiBaseUrl();
  assert.equal(
    mockStorage.getItem(STORAGE_KEYS.CUSTOM_API_BASE_URL),
    null,
    "Storage key phải bị xóa"
  );
  assert.equal(getApiBaseUrl(), "http://localhost:8080");
  assert.equal(storageEventFired, true);
  assert.deepEqual(customEventDetail, { url: "http://localhost:8080" });
  console.log("-> PASS: resetApiBaseUrl hoạt động chuẩn xác");

  // 6. pingEndpoint thành công
  console.log("[TEST 6] pingEndpoint đo latency thành công khi fetch thành công hoặc HTTP status trả về");
  const originalFetch = globalThis.fetch;

  globalScope.fetch = (async (input: RequestInfo | URL) => {
    const urlString = typeof input === "string" ? input : input.toString();
    assert.match(urlString, /\/api\/health$/);
    return new Response(null, { status: 200, statusText: "OK" });
  }) as typeof fetch;

  const pingRes = await pingEndpoint("http://localhost:8080/");
  assert.equal(pingRes.success, true);
  assert.equal(pingRes.status, 200);
  assert.equal(typeof pingRes.latencyMs, "number");
  assert.ok(pingRes.latencyMs >= 0, "Latency đo được phải >= 0ms");
  console.log(`-> PASS: pingEndpoint thành công, latencyMs = ${pingRes.latencyMs}ms`);

  // 7. pingEndpoint xử lý HTTP 404 (vẫn tính là có kết nối mạng tới server)
  console.log("[TEST 7] pingEndpoint coi status HTTP 404 là kết nối thành công");
  globalScope.fetch = (async () => {
    return new Response(null, { status: 404, statusText: "Not Found" });
  }) as typeof fetch;
  const ping404 = await pingEndpoint();
  assert.equal(ping404.success, true);
  assert.equal(ping404.status, 404);
  console.log("-> PASS: HTTP 404 ghi nhận thành công");

  // 8. pingEndpoint xử lý lỗi mạng (Failed to fetch) mà không crash uncaught
  console.log("[TEST 8] pingEndpoint xử lý lỗi mạng mà không throw uncaught");
  globalScope.fetch = (async () => {
    throw new Error("Failed to fetch (ECONNREFUSED)");
  }) as typeof fetch;
  const pingFail = await pingEndpoint("http://dead-server:9999");
  assert.equal(pingFail.success, false);
  assert.equal(pingFail.error, "Failed to fetch (ECONNREFUSED)");
  assert.equal(typeof pingFail.latencyMs, "number");
  console.log("-> PASS: Lỗi mạng được bắt an toàn:", pingFail.error);

  // Restore fetch
  globalScope.fetch = originalFetch;

  console.log("=== TOÀN BỘ 8/8 TEST CASES ĐÃ ĐẠT CHUẨN THÀNH CÔNG ===");
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
