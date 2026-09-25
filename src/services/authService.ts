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
  ResetPasswordRequest,
  ResendVerificationRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  MyProfileResponse
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

export async function verifyEmail(token: string): Promise<ApiResponse<any>> {
  const tokenParam = encodeURIComponent(token.trim());
  return await apiRequest<ApiResponse<any>>(`/api/auth/verify-email?token=${tokenParam}`, {
    method: "GET",
  });
}

export async function resendVerification(email: string): Promise<ApiResponse<any>> {
  return await apiRequest<ApiResponse<any>>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
    }),
  });
}

export async function resetPassword(payload: ResetPasswordRequest | ChangePasswordRequest): Promise<ApiResponse<string>> {
  return await apiRequest<ApiResponse<string>>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: payload.token.trim(),
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword,
    }),
  });
}

export const changePassword = resetPassword;

export async function changeUsername(payload: ChangeUsernameRequest | { newUsername: string }): Promise<ApiResponse<string>> {
  return await apiRequest<ApiResponse<string>>("/api/auth/change-username", {
    method: "PUT",
    body: JSON.stringify({
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

export async function getMe(): Promise<ApiResponse<AuthDataResponse>> {
  return await apiRequest<ApiResponse<AuthDataResponse>>("/api/auth/me", {
    method: "GET",
  });
}

export async function updateMyProfile(payload: UpdateProfileRequest): Promise<ApiResponse<MyProfileResponse>> {
  return await apiRequest<ApiResponse<MyProfileResponse>>("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(file: File): Promise<ApiResponse<MyProfileResponse>> {
  const formData = new FormData();
  formData.append("file", file);
  return await apiRequest<ApiResponse<MyProfileResponse>>("/api/auth/me/avatar", {
    method: "POST",
    body: formData,
  });
}

export async function getMyProfile(): Promise<ApiResponse<MyProfileResponse>> {
  return await apiRequest<ApiResponse<MyProfileResponse>>("/api/auth/me", {
    method: "GET",
  });
}
