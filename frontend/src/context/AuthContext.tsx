import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Credentials = {
  email: string;
  password: string;
};

type RegistrationDetails = Credentials & {
  name: string;
};

interface AuthContextType {
  token: string | null;
  userId: number | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (details: RegistrationDetails) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  access_token: string;
}

type Session = {
  token: string;
  userId: number;
  expiresAt: number;
};

const AuthContext = createContext<AuthContextType | null>(null);

function readSession(token: string | null): Session | null {
  if (!token) return null;
  const parts = token.split('.');
  const payload = parts[1];
  if (parts.length !== 3 || !payload || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
    return null;
  }

  try {
    const { sub, exp }: { sub?: unknown; exp?: unknown } = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );

    if (typeof sub !== 'string' || !/^[1-9]\d*$/.test(sub) || typeof exp !== 'number' || !Number.isSafeInteger(exp)) {
      return null;
    }

    const userId = Number(sub);
    const expiresAt = exp * 1000;
    if (!Number.isSafeInteger(userId) || expiresAt <= Date.now()) return null;

    return { token, userId, expiresAt };
  } catch {
    return null;
  }
}

async function postAuth(
  action: 'login' | 'register',
  details: Credentials | RegistrationDetails,
): Promise<Response> {
  try {
    return await fetch(`http://127.0.0.1:8000/api/auth/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(details),
    });
  } catch {
    throw new Error('Could not reach the API. Check that the server is running.');
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState(() => readSession(sessionStorage.getItem('token')));

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session) {
      sessionStorage.removeItem('token');
      return;
    }

    const timer = window.setTimeout(logout, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session, logout]);

  async function login(email: string, password: string): Promise<void> {
    const response = await postAuth('login', { email, password });

    if (response.status === 401) {
      throw new Error('Invalid email or password.');
    }

    if (!response.ok) {
      throw new Error('Unable to log in. Please try again.');
    }

    const data: LoginResponse | null = await response.json().catch(() => null);

    const nextSession = readSession(typeof data?.access_token === 'string' ? data.access_token : null);
    if (!nextSession) {
      throw new Error('The API returned an invalid session.');
    }

    sessionStorage.setItem('token', nextSession.token);
    setSession(nextSession);
  }

  async function register(details: RegistrationDetails): Promise<void> {
    const response = await postAuth('register', details);

    if (response.status === 409) {
      throw new Error('Email already registered.');
    }

    if (response.status === 400) {
      throw new Error('Check your name, email address, and password and try again.');
    }

    if (!response.ok) {
      throw new Error('Unable to create your account. Please try again.');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token: session?.token ?? null,
        userId: session?.userId ?? null,
        isAuthenticated: session !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
