import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { IUser } from "../assets/assets";
import api, { getErrorMessage } from "../configs/api";
import toast from "react-hot-toast";

interface AuthContextProps {
    isLoggedIn: boolean;
    // True until the initial session check finishes, so pages don't flash a logged-out state
    isAuthLoading: boolean;
    user: IUser | null;
    setCredits: (credits: number) => void;
    login: (user: { email: string; password: string }) => Promise<boolean>;
    signUp: (user: { name: string; email: string; password: string }) => Promise<boolean>;
    guestLogin: () => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    isLoggedIn: false,
    isAuthLoading: true,
    user: null,
    setCredits: () => {},
    login: async () => false,
    signUp: async () => false,
    guestLogin: async () => false,
    logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
        try {
            const { data } = await api.post(`/api/auth/register`, { name, email, password });
            setUser(data.user as IUser);
            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
        }
    };

    const login = async ({ email, password }: { email: string; password: string }) => {
        try {
            const { data } = await api.post(`/api/auth/login`, { email, password });
            setUser(data.user as IUser);
            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
        }
    };

    // One click, no form: creates a temporary guest account with a few credits
    const guestLogin = async () => {
        try {
            const { data } = await api.post(`/api/auth/guest`);
            setUser(data.user as IUser);
            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
        }
    };

    const logout = async () => {
        try {
            const { data } = await api.post(`/api/auth/logout`);
            toast.success(data.message);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setUser(null);
        }
    };

    const setCredits = useCallback((credits: number) => {
        setUser((prev) => (prev ? { ...prev, credits } : prev));
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/api/auth/verify`);
                setUser(data.user as IUser);
            } catch {
                // 401 just means there's no active session
                setUser(null);
            } finally {
                setIsAuthLoading(false);
            }
        })();
    }, []);

    const value = {
        isLoggedIn: !!user,
        isAuthLoading,
        user,
        setCredits,
        signUp,
        login,
        guestLogin,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
