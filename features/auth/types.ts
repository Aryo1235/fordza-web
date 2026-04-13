export interface User {
  id: string;
  username: string;
  name: string | null;
  role: "ADMIN" | "KASIR";
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    role: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}
