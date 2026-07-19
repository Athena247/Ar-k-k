import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("arikosk_token");
        if (!token) {
            setLoading(false);
            return;
        }
        authApi
            .me()
            .then(setUser)
            .catch(() => localStorage.removeItem("arikosk_token"))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const data = await authApi.login(email, password);
        localStorage.setItem("arikosk_token", data.token);
        setUser({ email: data.email, role: data.role });
        return data;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (e) {}
        localStorage.removeItem("arikosk_token");
        setUser(null);
    };

    return (
        <AuthCtx.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
