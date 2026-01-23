import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { GoogleSheetsService } from '../services/googleSheets';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('scot_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('scot_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            setLoading(true);
            const users = await GoogleSheetsService.fetchUsers();

            const foundUser = users.find((u: any) =>
                u.username.toLowerCase() === username.toLowerCase() &&
                u.password === password
            );

            if (foundUser) {
                const { password, ...safeUser } = foundUser as any; // Remove password from state
                setUser(safeUser);
                localStorage.setItem('scot_user', JSON.stringify(safeUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('scot_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
