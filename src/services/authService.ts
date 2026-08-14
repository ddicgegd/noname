/**
 * Authentication Business Service Module
 * Handles Login, Registration, Account Recovery, Password Reset, Username/Password Changes.
 */

import { apiRequest } from "../lib/api";
import { ApiResponse } from "../types/api";
import { 
  UserLoginRequest, 
  UserRegisterRequest, 
  AuthDataResponse, 
  ChangePasswordRequest, 
  ChangeUsernameRequest,
  RefreshTokenRequest
} from "../types/auth";

export async function loginUser(payload: UserLoginRequest): Promise<ApiResponse<AuthDataResponse>> {
  return await apiRequest<ApiResponse<AuthDataResponse>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: UserRegisterRequest): Promise<ApiResponse<AuthDataResponse>> {
  return await apiRequest<ApiResponse<AuthDataResponse>>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recoverAccount(email: string): Promise<ApiResponse<string>> {
  const emailParam = encodeURIComponent(email.trim());
  return await apiRequest<ApiResponse<string>>(`/api/auth/recover-account/${emailParam}`, {
    method: "GET",
  });
}

export async function changePassword(payload: ChangePasswordRequest): Promise<ApiResponse<string>> {
  try {
    return await apiRequest<ApiResponse<string>>("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (putErr) {
    const codeParam = encodeURIComponent(payload.token);
    return await apiRequest<ApiResponse<string>>(`/api/auth/reset-password?code=${codeParam}`, {
      method: "POST",
      body: JSON.stringify({
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      }),
    });
  }
}

export async function changeUsername(payload: ChangeUsernameRequest): Promise<ApiResponse<string>> {
  return await apiRequest<ApiResponse<string>>("/api/auth/change-username", {
    method: "PUT",
    body: JSON.stringify({
      token: payload.token,
      newUsername: payload.newUsername.trim(),
    }),
  });
}

export async function validateResetToken(token: string): Promise<ApiResponse<any>> {
  const tokenParam = encodeURIComponent(token.trim());
  return await apiRequest<ApiResponse<any>>(`/api/auth/validate-reset-token?token=${tokenParam}`, {
    method: "GET",
  });
}

export async function refreshSession(payload: RefreshTokenRequest): Promise<ApiResponse<AuthDataResponse>> {
  return await apiRequest<ApiResponse<AuthDataResponse>>("/api/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
