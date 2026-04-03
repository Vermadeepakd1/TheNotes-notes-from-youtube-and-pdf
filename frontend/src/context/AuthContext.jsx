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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
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
        return createdUser;
      },
      async login(payload) {
        const loggedInUser = await loginUser(payload);
        setUser(loggedInUser);
        return loggedInUser;
      },
      async logout() {
        await logoutUser();
        setUser(null);
      },
      async refresh() {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          return currentUser;
        } catch (error) {
          setUser(null);
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
