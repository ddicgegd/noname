/**
 * Fineract Error Extractor & Diagnostic Utility
 * Safely parses and normalizes Apache Fineract & Spring Boot ERP Gateway error payloads.
 */

import {
  FineractErrorResponse,
  FineractInnerResponse,
  FineractParsedError,
  FineractErrorField
} from "../types/fineract";

/**
 * Common Fineract Globalisation Code translations to Vietnamese
 */
export const FINERACT_I18N_CODES: Record<string, string> = {
  "error.msg.loan.approval.cannot.be.in.the.future":
    "Ngày phê duyệt hồ sơ vay không thể ở tương lai.",
  "error.msg.loan.disbursement.cannot.be.before.approval":
    "Ngày giải ngân thực tế không thể trước ngày phê duyệt khoản vay.",
  "error.msg.loan.repayment.amount.cannot.exceed.outstanding":
    "Số tiền thanh toán trả góp không thể vượt quá tổng dư nợ còn lại của khoản vay.",
  "error.msg.loan.account.is.not.active":
    "Hồ sơ khoản vay chưa được kích hoạt hoặc không ở trạng thái Hoạt động (Active).",
  "error.msg.loan.approval.not.allowed.in.current.state":
    "Chỉ có thể phê duyệt khoản vay khi hồ sơ đang ở trạng thái Chờ duyệt (Pending Approval).",
  "error.msg.loan.disbursement.not.allowed.in.current.state":
    "Chỉ có thể giải ngân khi khoản vay đã được Phê duyệt (Approved).",
  "error.msg.loan.reject.not.allowed.in.current.state":
    "Chỉ có thể từ chối khoản vay khi hồ sơ đang ở trạng thái Chờ duyệt (Pending Approval).",
  "error.msg.loan.withdraw.not.allowed.in.current.state":
    "Chỉ có thể rút lại hồ sơ vay khi đang ở trạng thái Chờ duyệt (Pending Approval).",
  "error.msg.loan.repayment.not.allowed.in.current.state":
    "Khoản vay chưa được giải ngân hoặc đã tất toán, không thể thực hiện giao dịch trả nợ.",
  "error.msg.gl.double.entry.imbalanced":
    "Nguyên tắc kế toán kép bị vi phạm: Tổng Nợ (Debit) phải luôn bằng Tổng Có (Credit).",
  "error.msg.client.externalId.already.exists":
    "Khách hàng với mã liên kết hệ thống (externalId) này đã tồn tại trên Core Banking.",
  "error.msg.client.duplicate.externalId":
    "Mã định danh khách hàng liên kết bị trùng lặp.",
  "error.msg.client.name.required":
    "Họ và tên khách hàng là bắt buộc, không được để trống.",
  "error.msg.loan.principal.amount.cannot.be.zero.or.negative":
    "Số tiền giải ngân/khoản vay phải lớn hơn 0.",
  "error.msg.loan.principal.out.of.bounds":
    "Số tiền vay nằm ngoài hạn mức tối thiểu và tối đa của gói sản phẩm tín dụng."
};

/**
 * Get friendly Vietnamese description for a globalisation code
 */
export function getVietnameseDescriptionForCode(code: string): string {
  return FINERACT_I18N_CODES[code] || "Lỗi nghiệp vụ từ hệ thống Core Banking Apache Fineract.";
}

/**
 * Extract and parse Fineract error payload from any arbitrary error object
 */
export function extractFineractError(error: unknown): FineractParsedError {
  let httpStatusCode = 400;
  let title = "Lỗi Core Banking (Fineract)";
  let defaultUserMessage = "Đã xảy ra lỗi khi thao tác với hệ thống Core Banking.";
  let developerMessage = "";
  let userMessageGlobalisationCode = "";
  let parameterName: string | undefined = undefined;
  let rawResponse: string | undefined = undefined;
  let isFineractError = false;
  let errors: FineractErrorField[] | undefined = undefined;

  if (!error) {
    return {
      httpStatusCode,
      title,
      defaultUserMessage,
      developerMessage,
      userMessageGlobalisationCode,
      isFineractError: false
    };
  }

  // Handle standard Error instance
  if (error instanceof Error) {
    defaultUserMessage = error.message;
    developerMessage = error.stack || error.message;
  }

  // Extract from potential nested data structures (Axios, Fetch, or custom exceptions)
  const errObj = error as any;
  const payload: FineractErrorResponse = errObj.data || errObj.response?.data || errObj;

  if (payload && typeof payload === "object") {
    if (typeof payload.httpStatusCode === "number") {
      httpStatusCode = payload.httpStatusCode;
    } else if (typeof errObj.status === "number") {
      httpStatusCode = errObj.status;
    } else if (typeof errObj.statusCode === "number") {
      httpStatusCode = errObj.statusCode;
    }

    if (payload.message && typeof payload.message === "string") {
      defaultUserMessage = payload.message;
    }

    // Inspect fineractResponse property (stringified JSON or object)
    let inner: FineractInnerResponse | null = null;

    if (typeof payload.fineractResponse === "string") {
      rawResponse = payload.fineractResponse;
      try {
        inner = JSON.parse(payload.fineractResponse);
      } catch {
        // Not valid JSON, keep as raw string
        developerMessage = payload.fineractResponse;
      }
    } else if (payload.fineractResponse && typeof payload.fineractResponse === "object") {
      inner = payload.fineractResponse as FineractInnerResponse;
      try {
        rawResponse = JSON.stringify(inner, null, 2);
      } catch {
        rawResponse = String(inner);
      }
    } else if ((payload as any).developerMessage || (payload as any).userMessageGlobalisationCode) {
      // The payload itself is already the inner Fineract response object
      inner = payload as unknown as FineractInnerResponse;
      try {
        rawResponse = JSON.stringify(inner, null, 2);
      } catch {
        rawResponse = String(inner);
      }
    }

    if (inner && typeof inner === "object") {
      isFineractError = true;

      if (inner.httpStatusCode) {
        const parsedCode = Number(inner.httpStatusCode);
        if (!isNaN(parsedCode) && parsedCode > 0) {
          httpStatusCode = parsedCode;
        }
      }

      if (inner.defaultUserMessage && typeof inner.defaultUserMessage === "string") {
        defaultUserMessage = inner.defaultUserMessage;
      }

      if (inner.developerMessage && typeof inner.developerMessage === "string") {
        developerMessage = inner.developerMessage;
      }

      if (inner.userMessageGlobalisationCode && typeof inner.userMessageGlobalisationCode === "string") {
        userMessageGlobalisationCode = inner.userMessageGlobalisationCode;
        // Enrich user message with Vietnamese translation if applicable
        const viTranslation = FINERACT_I18N_CODES[userMessageGlobalisationCode];
        if (viTranslation) {
          defaultUserMessage = viTranslation;
        }
      }

      if (inner.parameterName && typeof inner.parameterName === "string") {
        parameterName = inner.parameterName;
      }

      if (Array.isArray(inner.errors) && inner.errors.length > 0) {
        errors = inner.errors;
        const firstErr = inner.errors[0];
        if (!parameterName && firstErr.parameterName) {
          parameterName = firstErr.parameterName;
        }
        if (!userMessageGlobalisationCode && firstErr.userMessageGlobalisationCode) {
          userMessageGlobalisationCode = firstErr.userMessageGlobalisationCode;
        }
        if (firstErr.defaultUserMessage && defaultUserMessage === "Đã xảy ra lỗi khi thao tác với hệ thống Core Banking.") {
          defaultUserMessage = firstErr.defaultUserMessage;
        }
      }
    }
  } else if (typeof error === "string") {
    // String error
    rawResponse = error;
    try {
      const parsed = JSON.parse(error);
      return extractFineractError(parsed);
    } catch {
      defaultUserMessage = error;
      developerMessage = error;
    }
  }

  // Generate appropriate title based on HTTP status code
  if (httpStatusCode === 403) {
    title = "Từ Chối Nghiệp Vụ (HTTP 403)";
  } else if (httpStatusCode === 400) {
    title = "Dữ Liệu Không Hợp Lệ (HTTP 400)";
  } else if (httpStatusCode === 404) {
    title = "Không Tìm Thấy Bản Ghi (HTTP 404)";
  } else if (httpStatusCode >= 500) {
    title = "Lỗi Máy Chủ Core Banking (HTTP 500)";
  }

  return {
    httpStatusCode,
    title,
    defaultUserMessage,
    developerMessage: developerMessage || defaultUserMessage,
    userMessageGlobalisationCode,
    parameterName,
    rawResponse,
    isFineractError,
    errors
  };
}

/**
 * Format error for simple Toast notifications
 */
export function formatFineractErrorToast(error: unknown): {
  title: string;
  message: string;
  details?: string;
  code?: string;
  parameterName?: string;
} {
  const parsed = extractFineractError(error);

  let message = parsed.defaultUserMessage;
  if (parsed.parameterName) {
    message += ` (Tham số: ${parsed.parameterName})`;
  }

  return {
    title: parsed.title,
    message,
    details: parsed.developerMessage !== parsed.defaultUserMessage ? parsed.developerMessage : undefined,
    code: parsed.userMessageGlobalisationCode || undefined,
    parameterName: parsed.parameterName
  };
}
