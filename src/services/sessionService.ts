/**
 * Device Session Management Service
 * Supports retrieving active sessions and revoking single or all other sessions.
 * Aligned with DEVICE_SESSIONS_API_AND_UI_SPEC.md
 */

import { getApiBaseUrl, unifiedFetch } from "../lib/api";
import { getAppErrorMessage } from "../components/ui/AppErrorNotice";
import { ApiResponse } from "../types/api";
import { 
  SessionListData, 
  TerminateSessionData, 
  TerminateOtherSessionsData 
} from "../types/session";

export async function getActiveSessions(): Promise<ApiResponse<SessionListData>> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  let res: Response;
  try {
    res = await unifiedFetch(`${baseUrl}/api/v1/auth/sessions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok && res.status === 404 && typeof window !== "undefined" && !baseUrl.includes(window.location.host)) {
      const fallbackRes = await unifiedFetch("/api/v1/auth/sessions", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    }
  } catch (fetchErr) {
    if (typeof window !== "undefined" && baseUrl && !baseUrl.includes(window.location.host)) {
      const fallbackRes = await unifiedFetch("/api/v1/auth/sessions", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    }
    throw fetchErr;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(getAppErrorMessage(errorData?.message || errorData?.status?.message || res.status));
  }
  return await res.json();
}

export async function terminateSession(sessionId: string): Promise<ApiResponse<TerminateSessionData>> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  let res: Response;
  try {
    res = await unifiedFetch(`${baseUrl}/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok && res.status === 404 && typeof window !== "undefined" && !baseUrl.includes(window.location.host)) {
      const fallbackRes = await unifiedFetch(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    }
  } catch (fetchErr) {
    if (typeof window !== "undefined" && baseUrl && !baseUrl.includes(window.location.host)) {
      const fallbackRes = await unifiedFetch(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    }
    throw fetchErr;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(getAppErrorMessage(errorData?.message || errorData?.status?.message || res.status));
  }
  return await res.json();
}

export async function terminateOtherSessions(): Promise<ApiResponse<TerminateOtherSessionsData>> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  let res: Response;
  try {
    res = await unifiedFetch(`${baseUrl}/api/v1/auth/sessions/others`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok && res.status === 404 && typeof window !== "undefined" && !baseUrl.includes(window.location.host)) {
      const fallbackRes = await unifiedFetch("/api/v1/auth/sessions/others", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    }
  } catch (fetchErr) {
    if (typeof window !== "undefined" && baseUrl && !baseUrl.includes(window.location.host)) {
      const fallbackRes = await unifiedFetch("/api/v1/auth/sessions/others", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    }
    throw fetchErr;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(getAppErrorMessage(errorData?.message || errorData?.status?.message || res.status));
  }
  return await res.json();
}
