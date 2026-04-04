import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  getErrorMessage,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/api";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "smart-notes-user";

function isUnauthorizedError(error) {
  return error?.response?.status === 401;
}

function isRecoverableSessionError(error) {
  if (error?.response) {
    return false;
  }

  const code = (error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    message.includes("network") ||
    message.includes("timeout")
  );
}

function readStoredUser() {
  try {
    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures and keep the in-memory session working.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    typeof window === "undefined" ? null : readStoredUser(),
  );
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          storeUser(currentUser);
        }
      } catch (error) {
        if (mounted) {
          const storedUser = readStoredUser();

          if (storedUser && isRecoverableSessionError(error)) {
            setUser(storedUser);
          } else {
            setUser(null);
            storeUser(null);
          }
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      async register(payload) {
        const createdUser = await registerUser(payload);
        setUser(createdUser);
        storeUser(createdUser);
        return createdUser;
      },
      async login(payload) {
        const loggedInUser = await loginUser(payload);
        setUser(loggedInUser);
        storeUser(loggedInUser);
        return loggedInUser;
      },
      async logout() {
        try {
          await logoutUser();
        } finally {
          setUser(null);
          storeUser(null);
        }
      },
      async refresh() {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          storeUser(currentUser);
          return currentUser;
        } catch (error) {
          if (!isUnauthorizedError(error) && isRecoverableSessionError(error)) {
            const storedUser = readStoredUser();

            if (storedUser) {
              setUser(storedUser);
              return storedUser;
            }
          }

          setUser(null);
          storeUser(null);
          throw new Error(getErrorMessage(error, "Unable to refresh session"));
        }
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
