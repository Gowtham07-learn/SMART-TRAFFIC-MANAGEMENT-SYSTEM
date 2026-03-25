import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
    ADMIN: 'ADMIN',
    TRAFFIC_CONTROLLER: 'TRAFFIC_CONTROLLER',
    EMERGENCY_DRIVER: 'EMERGENCY_DRIVER',
    CITIZEN: 'CITIZEN'
};

const VALID_EMAILS = {
    [ROLES.ADMIN]: 'admin@gmail.com',
    [ROLES.TRAFFIC_CONTROLLER]: 'trafic@gmail.com',
    [ROLES.EMERGENCY_DRIVER]: 'driver@gmail.com',
    [ROLES.CITIZEN]: 'person@gmail.com'
};

const VALID_PASSWORD = 'test1234';

export const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                return null;
            }
        }
        return null; // Enforce missing user
    });

    const login = (email, password, role) => {
        // Step 1: Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        // Step 2: Check password
        if (password.length < 8 || password !== VALID_PASSWORD) {
            return { success: false, error: 'Wrong password. Try again' };
        }

        // Step 3: Match role + email
        if (VALID_EMAILS[role] !== email) {
            return { success: false, error: 'Access denied for this role' };
        }

        // Success Case
        const newUser = { email, role };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        return { success: true };
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, role: user?.role, login, logout, hasAccess }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
