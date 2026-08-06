/**
 * Centralized API Integration Helper for Horizon Cloud
 * 
 * Configured with VITE_API_BASE_URL from environment variables.
 * For CORS configuration on your API server, please allow requests from:
 * https://ais-dev-6w3codzjghtgoyid4qahhy-654729272692.asia-east1.run.app
 */

export function getApiBaseUrl(): string {
  let stored = localStorage.getItem("horizon_api_base_url");
  if (stored === "http://localhost:3999" || stored === "http://localhost:8080") {
    localStorage.setItem("horizon_api_base_url", "https://mummified-escapable-proven.ngrok-free.dev");
    stored = "https://mummified-escapable-proven.ngrok-free.dev";
  }
  if (stored) return stored;
  return (import.meta as any).env.VITE_API_BASE_URL || "https://mummified-escapable-proven.ngrok-free.dev";
}

export function isProxyEnabled(): boolean {
  let stored = localStorage.getItem("horizon_use_api_proxy");
  if (stored === null) {
    // Default to true inside AI Studio preview to prevent CORS failures
    localStorage.setItem("horizon_use_api_proxy", "true");
    return true;
  }
  return stored === "true";
}

export function setProxyEnabled(enabled: boolean): void {
  localStorage.setItem("horizon_use_api_proxy", enabled ? "true" : "false");
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const targetUrl = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  
  const useProxy = isProxyEnabled();
  const fetchUrl = useProxy ? "/api/proxy" : targetUrl;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("ngrok-skip-browser-warning", "true");

  if (useProxy) {
    // Đưa URL đích thực tế vào Header để Server Node.js proxy xử lý
    headers.set("X-Target-URL", targetUrl);
  }

  try {
    const response = await fetch(fetchUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any = null;
      let rawText = "";
      try {
        rawText = await response.text();
        try {
          errorData = JSON.parse(rawText);
        } catch (_) {
          // not JSON
        }
      } catch (e) {
        // failed to read response body
      }

      let friendlyMsg = errorData?.detail || errorData?.message || errorData?.title || errorData?.error;
      
      if (!friendlyMsg) {
        if (response.status === 401) {
          friendlyMsg = "Tên đăng nhập hoặc mật khẩu không chính xác.";
        } else if (response.status === 400) {
          friendlyMsg = "Thông tin không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (response.status === 404) {
          friendlyMsg = "Tài khoản hoặc thông tin không tồn tại trên hệ thống.";
        } else {
          friendlyMsg = `Yêu cầu không thành công (Mã: ${response.status}).`;
        }
      }

      const err: any = new Error(friendlyMsg);
      err.status = response.status;
      err.data = errorData;
      throw err;
    }

    return await response.json();
  } catch (error) {
    console.warn(
      `[API Connection Info] URL: ${targetUrl} (Bypass CORS Proxy: ${useProxy ? "BẬT" : "TẮT"}) không thể kết nối. ` +
      `Điều này thường xảy ra nếu backend Spring Boot cục bộ của bạn chưa chạy, hoặc chưa được tạo tunnel qua ngrok/localtunnel. Origin hiện tại: ${window.location.origin}.`,
      error
    );
    throw error;
  }
}
