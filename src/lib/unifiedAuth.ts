import { getUnifiedAccessToken } from "./api";

export { getUnifiedAccessToken };

export function getEffectiveAccessToken(): string {
  return getUnifiedAccessToken();
}
