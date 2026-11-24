import { User } from '../types';
import { API_BASE_URL, SUPABASE_PUBLIC_KEY } from './apiConfig';

export interface AuthCredentials {
  identifier: string;
  password: string;
}

export interface RegistrationData {
  fullName: string;
  businessName?: string;
  phone: string;
  whatsAppNumber?: string;
  email: string;
  password: string;
  address?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  area?: string;
  productCategory?: string;
  accountType: 'buyer' | 'seller' | 'logistics';
  registrationLanguage?: 'ha' | 'en';
  profileImage?: string;
}

interface AuthResponse {
  success?: boolean;
  user?: User;
  error?: string;
  message?: string;
}


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLIC_KEY,
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Unable to reach the authentication service. Please try again.');
  }

  const result = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(`${result.error || 'Authentication request failed'} (${response.status})`);
  }
  return result;
}

/** Uses the existing cookie-backed API; no local/demo credentials are accepted. */
export const authApi = {
  async login(credentials: AuthCredentials): Promise<User> {
    const result = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!result.success || !result.user) throw new Error(result.error || 'Login failed.');
    return result.user;
  },

  async loginAdmin(credentials: AuthCredentials): Promise<User> {
    const result = await request<AuthResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!result.success || !result.user || result.user.accountType !== 'admin') {
      throw new Error(result.error || 'Super Admin authentication failed.');
    }
    return result.user;
  },

  async bootstrapAdmin(data: { setupToken: string; fullName: string; email: string; phone: string; password: string }): Promise<User> {
    const result = await request<AuthResponse>('/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success || !result.user || result.user.accountType !== 'admin') {
      throw new Error(result.error || 'First Super Admin setup failed.');
    }
    return result.user;
  },

  async register(data: RegistrationData): Promise<AuthResponse> {
    const result = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error || 'Registration failed.');
    return result;
  },

  async currentUser(): Promise<User | null> {
    try {
      const result = await request<{ user?: User }>('/auth/me');
      return result.user || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('(401)')) return null;
      throw error;
    }
  },

  async heartbeat(): Promise<void> {
    await request<{ success: boolean }>('/auth/heartbeat', { method: 'POST' });
  },

  async logout(): Promise<void> {
    await request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  },
};
