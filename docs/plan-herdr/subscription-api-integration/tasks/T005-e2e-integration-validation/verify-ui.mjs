import { chromium } from "playwright";

async function verifyUI() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    } else {
      consoleLogs.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // Wait for SplashScreen to exit
  console.log("Waiting for splash screen transition...");
  await page.waitForTimeout(2500);

  console.log("Finding pricing cards...");
  const pricingSection = page.locator("#pricing");
  await pricingSection.scrollIntoViewIfNeeded();

  // Find the first HoloCard
  const holoCard = pricingSection.locator(".cursor-pointer").first();
  await holoCard.waitFor({ state: "visible", timeout: 5000 });

  console.log("Clicking HoloCard to open payment sheet...");
  await holoCard.click();

  // Wait for dialog to open
  const dialog = page.locator("[role='dialog']");
  await dialog.waitFor({ state: "visible", timeout: 5000 });

  // Measure physical dimensions
  const dialogBox = await dialog.boundingBox();
  console.log("Dialog Bounding Box:", JSON.stringify(dialogBox));

  // Check CTA button
  const ctaButton = dialog.locator("button:has-text('Dùng thử'), button:has-text('Thanh toán')").last();
  await ctaButton.waitFor({ state: "visible", timeout: 3000 });
  const ctaBox = await ctaButton.boundingBox();
  const ctaText = await ctaButton.innerText();
  console.log("CTA Button Box:", JSON.stringify(ctaBox));
  console.log("CTA Button Text:", ctaText);

  // Check computed styles
  const ctaStyles = await ctaButton.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return {
      display: s.display,
      visibility: s.visibility,
      opacity: s.opacity,
      height: s.height,
    };
  });
  console.log("CTA Computed Styles:", JSON.stringify(ctaStyles));

  // Check scrollHeight vs clientHeight on modal and right column
  const scrollMetrics = await dialog.evaluate((el) => {
    const rightCol = el.querySelector(".md\\:col-span-7") || el;
    return {
      dialogScrollHeight: el.scrollHeight,
      dialogClientHeight: el.clientHeight,
      hasDialogScrollbar: el.scrollHeight > el.clientHeight,
      rightColScrollHeight: rightCol.scrollHeight,
      rightColClientHeight: rightCol.clientHeight,
      hasRightColScrollbar: rightCol.scrollHeight > rightCol.clientHeight,
    };
  });
  console.log("Scroll Metrics:", JSON.stringify(scrollMetrics));

  // Test selecting MoMo
  console.log("Selecting MoMo payment option...");
  const momoOption = dialog.locator("[role='radio']:has-text('Ví MoMo')");
  await momoOption.click();
  const momoCtaText = await ctaButton.innerText();
  console.log("CTA text after MoMo selection:", momoCtaText);

  // Test selecting VNPay
  console.log("Selecting VNPay payment option...");
  const vnpayOption = dialog.locator("[role='radio']:has-text('VNPay')");
  await vnpayOption.click();
  const vnpayCtaText = await ctaButton.innerText();
  console.log("CTA text after VNPay selection:", vnpayCtaText);

  // Test clicking CTA button without login (Check deterministic unauthenticated handling)
  console.log("Clicking CTA button to check unauthenticated feedback...");
  await ctaButton.click();
  await page.waitForTimeout(500);

  const errorBanner = dialog.locator(".bg-rose-50").first();
  const isErrorVisible = await errorBanner.isVisible();
  const errorText = isErrorVisible ? await errorBanner.innerText() : "none";
  console.log("Error Banner visible:", isErrorVisible, "Text:", errorText.replace(/\n/g, " | "));

  // Take screenshot
  const screenshotPath = "C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/tasks/T005-e2e-integration-validation/screenshot-payment-sheet.png";
  await dialog.screenshot({ path: screenshotPath });
  console.log("Saved screenshot to:", screenshotPath);

  console.log("Console errors count:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log("Console errors:", consoleErrors);
  }

  await browser.close();
  console.log("E2E VERIFICATION COMPLETED SUCCESSFULLY!");
}

verifyUI().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
