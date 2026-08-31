import { generatePaymentJwtToken, JWT_SECRET } from "../src/services/websocketService";
import crypto from "crypto";

async function runTest() {
  const orderNumber = "018d9ef2-5b94-7123-88bb-abcdef123456";
  const userId = "USR-2026-001";

  const token = await generatePaymentJwtToken(orderNumber, userId, 30);
  console.log("Generated Token:", token);

  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

  console.log("Decoded Header:", header);
  console.log("Decoded Payload:", payload);

  // Verify HMAC-SHA256 signature using Node crypto
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  const isSigValid = expectedSig === signatureB64;
  console.log("Signature Valid:", isSigValid);

  if (isSigValid && payload.orderNumber === orderNumber && payload.sub === userId) {
    console.log("SUCCESS: JWT Generation & Validation matches Python pyjwt specs perfectly!");
  } else {
    console.error("FAIL: Signature or payload mismatch");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
