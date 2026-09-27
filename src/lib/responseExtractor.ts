/**
 * Backend Response Message Extractor Module
 * 
 * Strict implementation according to the 5-Case Backend API Spec:
 * - Case 1 & 2 (Success & Unverified Email Envelope): Extracted from response.data.message.
 * - Case 3 (DTO Validation Errors - VALIDATION_FAILED): Extracted from fieldErrors for inline input display.
 *   General top message is set to empty string so NO top banner alert is rendered.
 * - Case 4 & 5 (Business Exceptions & System Errors): Extracted directly from response.detail for top Banner display.
 */

import { ApiResponse, ExtractedMessageResult } from "../types/api";

export function extractBackendMessage(response: ApiResponse): ExtractedMessageResult {
  if (response !== undefined && response !== null) {
    // Case 1 & 2: Success / Account Unverified Envelope (response.data or response.data.message)
    if (typeof response.data === "string" && response.data.trim().length > 0) {
      return { message: response.data.trim() };
    }
    if (response.data !== undefined && response.data !== null && typeof response.data === "object") {
      if (typeof response.data.message === "string" && response.data.message.trim().length > 0) {
        return { message: response.data.message.trim() };
      }
    }

    // Case 3: DTO Validation Errors (VALIDATION_FAILED with fieldErrors)
    // Field errors are displayed below inputs. General message is empty to prevent top banner.
    if (response.errorCode === "VALIDATION_FAILED" && response.fieldErrors !== undefined && response.fieldErrors !== null) {
      return {
        message: "",
        fieldErrors: response.fieldErrors
      };
    }

    // Case 4 & 5: Business Exceptions & System Errors (ProblemDetail response.detail)
    if (typeof response.detail === "string" && response.detail.trim().length > 0) {
      return { message: response.detail.trim() };
    }

    // Direct message property if detail is absent
    if (typeof response.message === "string" && response.message.trim().length > 0) {
      return { message: response.message.trim() };
    }

    // ProblemDetail title if detail is absent
    if (typeof response.title === "string" && response.title.trim().length > 0) {
      return { message: response.title.trim() };
    }

    // Status Envelope message
    if (response.status !== undefined && response.status !== null && typeof response.status === "object") {
      if (typeof response.status.message === "string" && response.status.message.trim().length > 0) {
        return { message: response.status.message.trim() };
      }
    }
  }

  // Backend returned no text message
  return { message: "" };
}

export function sanitizeErrorMessage(msg: string): string {
  if (!msg) {
    return "";
  }
  let clean = msg;
  clean = clean.replace(/API Error:\s*\d+\s*(Unauthorized|Bad Request|Internal Server Error|Forbidden)?/i, "").trim();
  clean = clean.replace(/^(API Error:\s*\d+|Error\s*\d+|Mã lỗi:\s*\d+)\s*-?\\s*/i, "").trim();
  // Sanitize URLs, hostnames, ports, and internal endpoints to avoid leaking technical details
  clean = clean.replace(/https?:\/\/[^\s/$.?#].[^\s]*/gi, "").trim();
  clean = clean.replace(/localhost(:\d+)?/gi, "").trim();
  clean = clean.replace(/\/api\/[a-zA-Z0-9_\-\/]+/gi, "").trim();

  if (
    clean.includes("Failed to fetch") ||
    clean.includes("NetworkError") ||
    clean.includes("Network Error") ||
    clean.includes("ECONNREFUSED") ||
    clean.includes("connection refused") ||
    clean.length === 0
  ) {
    return "Mã lỗi: SYS-503 (Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau ít phút).";
  }
  return clean;
}
