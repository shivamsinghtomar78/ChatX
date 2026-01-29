import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, loginWithEmail, registerWithEmail, loginWithGoogle, logout } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            await loginWithEmail(email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email, password) => {
        try {
            setError(null);
            await registerWithEmail(email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signInWithGoogle = async () => {
        try {
            setError(null);
            await loginWithGoogle();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signOut = async () => {
        try {
            await logout();
        } catch (err) {
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
