/**
 * UI Audit Script for Antigravity & Headless Chromium / Playwright
 * Kiểm tra Màn hình trắng (WSOD), Bounding Box hình học, Computed Styles,
 * Crash overlay, Console Exceptions và chụp ảnh thị giác thực tế (.audit/).
 */

import fs from 'fs';
import path from 'path';

export async function auditUI(targetUrl = "http://localhost:3000", options = {}) {
  const timeoutMs = options.timeout ?? 15000;
  let browserInstance;
  let page;

  try {
    // 1. Khởi tạo Headless Browser (Hỗ trợ Playwright hoặc OMP global browser)
    if (typeof globalThis.browser !== "undefined" && globalThis.browser.open) {
      page = await globalThis.browser.open({
        url: targetUrl,
        headless: true,
        timeout: timeoutMs,
      });
    } else {
      const { chromium } = await import("playwright");
      browserInstance = await chromium.launch({ headless: true });
      const context = await browserInstance.newContext({
        viewport: { width: 1440, height: 900 },
      });
      page = await context.newPage();
    }

    const consoleLogs = [];
    const runtimeErrors = [];

    // Lắng nghe console và runtime exceptions
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleLogs.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      runtimeErrors.push(err.message || String(err));
    });

    if (page.goto) {
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
    }

    // Chờ 1.5s để ổn định các micro-animations và hydration
    await page.waitForTimeout ? await page.waitForTimeout(1500) : await page.waitFor({ timeout: 1500 }).catch(() => {});

    // 2. Phân tích Thực nghiệm Đa tầng để phát hiện Màn Hình Trắng (WSOD) & Sụp Đổ Render
    const domDiagnostic = await page.evaluate(() => {
      const root =
        document.querySelector("#root") ||
        document.querySelector("#__next") ||
        document.querySelector("main") ||
        document.body;

      if (!root) {
        return { isBlank: true, reason: "NO_ROOT_ELEMENT", hasErrorOverlay: false };
      }

      const rect = root.getBoundingClientRect();
      const style = window.getComputedStyle(root);

      // 2.1. Kiểm tra kích thước vật lý hiển thị (Physical Render Metrics)
      const hasZeroDimensions = rect.width === 0 || rect.height === 0;

      // 2.2. Kiểm tra tính hữu hình CSS (Computed Styles)
      const isHiddenByStyle =
        style.display === "none" ||
        style.visibility === "hidden" ||
        parseFloat(style.opacity || "1") === 0;

      // 2.3. Bắt các error overlay & React Error Boundaries
      const hasNextErrorOverlay = !!document.querySelector(
        "nextjs-portal, [data-nextjs-dialog-overlay]"
      );
      const hasViteErrorOverlay = !!document.querySelector("vite-error-overlay");
      const hasReactBoundaryOverlay = !!document.querySelector(
        "[data-react-error-boundary], [role='alert'].error, .react-error-overlay"
      );

      const hasErrorOverlay =
        hasNextErrorOverlay || hasViteErrorOverlay || hasReactBoundaryOverlay;

      // 2.4. Kiểm tra khoảng trắng vô định (Empty Void)
      const isContentEmpty =
        root.children.length === 0 &&
        (!root.innerText || root.innerText.trim().length === 0);

      const isBlank = hasZeroDimensions || isHiddenByStyle || isContentEmpty;

      return {
        isBlank,
        hasErrorOverlay,
        dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
        styles: { display: style.display, visibility: style.visibility, opacity: style.opacity },
        childCount: root.children.length,
        textLength: root.innerText ? root.innerText.trim().length : 0,
        title: document.title,
      };
    });

    // 3. Đảm bảo thư mục lưu bằng chứng .audit/ tồn tại
    const auditDir = path.resolve(process.cwd(), ".audit");
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    // 4. Chụp ảnh màn hình làm bằng chứng thị giác
    const screenshotPath = path.join(auditDir, "ui-latest-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    // 5. Kết luận trạng thái kiểm định
    const isCrashed =
      domDiagnostic.isBlank ||
      domDiagnostic.hasErrorOverlay ||
      runtimeErrors.length > 0;

    const result = {
      passed: !isCrashed,
      status: isCrashed ? "CRASHED_OR_BLANK" : "RENDERED",
      evidence: {
        screenshot: screenshotPath,
        dom: domDiagnostic,
        runtimeErrors,
        consoleErrors: consoleLogs,
      },
    };

    return result;
  } catch (err) {
    return {
      passed: false,
      status: "FAILED_TO_CONNECT",
      evidence: {
        error: err instanceof Error ? err.message : String(err),
      },
    };
  } finally {
    if (page && page.close) {
      await page.close().catch(() => {});
    }
    if (browserInstance) {
      await browserInstance.close().catch(() => {});
    }
  }
}

// Hỗ trợ thực thi trực tiếp qua CLI: node audit-ui.js <url>
if (process.argv[1] && process.argv[1].endsWith('audit-ui.js')) {
  const url = process.argv[2] || "http://localhost:3000";
  auditUI(url).then((res) => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.passed ? 0 : 1);
  });
}
