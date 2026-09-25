/**
 * Device Session Management Data Types
 * Aligned with DEVICE_SESSIONS_API_AND_UI_SPEC.md
 */

export type ClientDeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "desktop" | "mobile" | "tablet";

export interface DeviceSession {
  id: string;
  deviceName: string;
  clientType: "DESKTOP" | "MOBILE" | "TABLET" | "desktop" | "mobile" | "tablet";
  deviceDetail: string;
  ip: string;
  location: string;
  lastActive: string;
  lastActiveAt?: string;
  isCurrent: boolean;
}

export interface SessionListData {
  totalActive: number;
  currentSessionId: string;
  sessions: DeviceSession[];
}

export interface TerminateSessionData {
  terminatedSessionId: string;
  remainingActive: number;
}

export interface TerminateOtherSessionsData {
  terminatedCount: number;
  remainingActive: number;
}
