import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner-large"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to auth page, but save the intended location
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
