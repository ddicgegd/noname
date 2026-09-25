/**
 * Device Session Management Service
 * Supports retrieving active sessions and revoking single or all other sessions.
 * Aligned with DEVICE_SESSIONS_API_AND_UI_SPEC.md
 */

import { unifiedFetch } from "../lib/api";
import { ApiResponse } from "../types/api";
import { 
  SessionListData, 
  TerminateSessionData, 
  TerminateOtherSessionsData 
} from "../types/session";

export async function getActiveSessions(): Promise<ApiResponse<SessionListData>> {
  const res = await unifiedFetch("/api/v1/auth/sessions", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.status?.message || `Lỗi truy xuất phiên (${res.status})`);
  }
  return await res.json();
}

export async function terminateSession(sessionId: string): Promise<ApiResponse<TerminateSessionData>> {
  const res = await unifiedFetch(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.status?.message || `Lỗi thu hồi phiên (${res.status})`);
  }
  return await res.json();
}

export async function terminateOtherSessions(): Promise<ApiResponse<TerminateOtherSessionsData>> {
  const res = await unifiedFetch("/api/v1/auth/sessions/others", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.status?.message || `Lỗi đăng xuất các phiên khác (${res.status})`);
  }
  return await res.json();
}
