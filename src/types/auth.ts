/**
 * Authentication Business Domain Request & Response Types
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  ipAddress?: string;
}

export interface UserLoginRequest {
  usernameOrEmail: string;
  password: string;
  deviceInfo: DeviceInfo;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface AuthDataResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  message?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  gender?: string;
  phoneNumber?: string;
  token?: string;
  id?: number;
  fullName?: string;
  roles?: string[];
}

export interface AccountRecoveryRequest {
  email: string;
}

export interface ChangePasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeUsernameRequest {
  token: string;
  newUsername: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo: DeviceInfo;
}
