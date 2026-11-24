import { createContext, useContext, useState, type ReactNode } from 'react';

type Credentials = {
  email: string;
  password: string;
};

type RegistrationDetails = Credentials & {
  name: string;
};

interface AuthContextType {
  token: string | null;
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

const AuthContext = createContext<AuthContextType | null>(null);

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
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('token');
  });

  async function login(email: string, password: string): Promise<void> {
    const response = await postAuth('login', { email, password });

    if (response.status === 401) {
      throw new Error('Invalid email or password.');
    }

    if (!response.ok) {
      throw new Error('Unable to log in. Please try again.');
    }

    const data: LoginResponse | null = await response.json().catch(() => null);

    if (typeof data?.access_token !== 'string' || !data.access_token) {
      throw new Error('The API returned an invalid session.');
    }

    // Save token to session storage
    sessionStorage.setItem('token', data.access_token);

    // Update React state
    setToken(data.access_token);
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

  function logout(): void {
    sessionStorage.removeItem('token');
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
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
