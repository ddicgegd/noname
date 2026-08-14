/**
 * API Response Interfaces & RFC 7807 ProblemDetail Definitions
 */

export interface StatusEnvelope {
  code: number;
  message: string;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  status?: StatusEnvelope;
  data?: T;
  type?: string;
  title?: string;
  detail?: string;
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string>;
}

export interface ExtractedMessageResult {
  message: string;
  fieldErrors?: Record<string, string>;
}
