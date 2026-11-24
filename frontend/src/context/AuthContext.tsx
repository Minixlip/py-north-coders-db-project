import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  access_token: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('token');
  });

  async function login(email: string, password: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Could not reach the API. Check that the server is running.');
    }

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
