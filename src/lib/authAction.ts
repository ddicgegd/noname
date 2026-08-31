// Điều phối và xử lý tác vụ theo trạng thái đăng nhập hoặc chưa đăng nhập

import { STORAGE_KEYS } from "./storageKeys";

export interface UserSession {
  token: string;
  user?: Record<string, any> | null;
}

export interface PendingActionData<T = any> {
  actionId: string;
  returnUrl?: string;
  payload?: T;
  createdAt: number;
}

const PENDING_ACTION_TTL_MS = 5 * 60 * 1000;

export function savePendingAction<T = any>(action: {
  actionId: string;
  returnUrl?: string;
  payload?: T;
}): void {
  try {
    const data: PendingActionData<T> = {
      actionId: action.actionId,
      returnUrl: action.returnUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search + window.location.hash : ""),
      payload: action.payload,
      createdAt: Date.now()
    };
    sessionStorage.setItem(STORAGE_KEYS.PENDING_AUTH_ACTION, JSON.stringify(data));
  } catch {}
}

export function consumePendingAction<T = any>(): PendingActionData<T> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.PENDING_AUTH_ACTION);
    if (!raw) return null;

    sessionStorage.removeItem(STORAGE_KEYS.PENDING_AUTH_ACTION);
    const data: PendingActionData<T> = JSON.parse(raw);

    if (!data.createdAt || Date.now() - data.createdAt > PENDING_ACTION_TTL_MS) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearPendingAction(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_AUTH_ACTION);
  } catch {}
}

export interface AuthHandlerOptions<TArgs extends any[], TReturn> {
  actionId?: string;
  checkAuth?: () => UserSession | null;
  onAuthenticated: (session: UserSession, ...args: TArgs) => TReturn | Promise<TReturn>;
  onGuest?: (...args: TArgs) => TReturn | Promise<TReturn> | void;
}

export function createAuthAction<TArgs extends any[] = any[], TReturn = any>(
  options: AuthHandlerOptions<TArgs, TReturn>
) {
  return async (...args: TArgs): Promise<TReturn | null | void> => {
    const session: UserSession | null = options.checkAuth
      ? options.checkAuth()
      : (() => {
          try {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || "";
            if (!token) return null;

            const userRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            const user = userRaw ? JSON.parse(userRaw) : null;
            return { token, user };
          } catch {
            return null;
          }
        })();

    if (session && session.token) {
      return await options.onAuthenticated(session, ...args);
    }

    if (options.actionId) {
      const serializableArgs = args.filter(arg => !(arg && typeof arg === "object" && ("nativeEvent" in arg || "target" in arg || "preventDefault" in arg)));
      savePendingAction({
        actionId: options.actionId,
        payload: serializableArgs.length === 1 ? serializableArgs[0] : serializableArgs
      });
    }

    if (options.onGuest) {
      return await options.onGuest(...args);
    }

    return null;
  };
}
