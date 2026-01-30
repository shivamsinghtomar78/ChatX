"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, onAuthStateChanged, loginWithEmail, registerWithEmail, loginWithGoogle, logout, User } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            await loginWithEmail(email, password);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email: string, password: string) => {
        try {
            setError(null);
            await registerWithEmail(email, password);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const signInWithGoogle = async () => {
        try {
            setError(null);
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const signOut = async () => {
        try {
            await logout();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
