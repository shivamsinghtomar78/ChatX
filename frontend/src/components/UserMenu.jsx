import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';
import './UserMenu.css';

const UserMenu = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
    const photoURL = user.photoURL;

    return (
        <div className="user-menu">
            <button
                className="user-menu-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {photoURL ? (
                    <img src={photoURL} alt={displayName} className="user-avatar" />
                ) : (
                    <div className="user-avatar-placeholder">
                        {getInitials(displayName)}
                    </div>
                )}
                <span className="user-name">{displayName}</span>
                <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="user-menu-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="user-menu-dropdown">
                        <div className="user-menu-header">
                            <div className="user-info">
                                <span className="user-email">{user.email}</span>
                            </div>
                        </div>
                        <div className="user-menu-divider" />
                        <button className="user-menu-item" onClick={handleSignOut}>
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserMenu;
