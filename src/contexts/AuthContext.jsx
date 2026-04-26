import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
    ADMIN: 'ADMIN',
    TRAFFIC_CONTROLLER: 'TRAFFIC_CONTROLLER',
    EMERGENCY_DRIVER: 'EMERGENCY_DRIVER',
    CITIZEN: 'CITIZEN'
};

export const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                return null;
            }
        }
        return null; // Enforce missing user
    });

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!data.success) {
                return { success: false, error: data.error || 'Login failed' };
            }
            sessionStorage.setItem('access_token', data.data.access_token);
            sessionStorage.setItem('refresh_token', data.data.refresh_token);
            sessionStorage.setItem('user', JSON.stringify(data.data.user));
            setUser(data.data.user);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || 'Network error' };
        }
    };

    const logout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, role: user?.role, login, logout, hasAccess }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
