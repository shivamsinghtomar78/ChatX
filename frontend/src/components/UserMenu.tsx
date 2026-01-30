"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ChevronDown, User as UserIcon, Settings, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
    const photoURL = user.photoURL;

    return (
        <div className="relative">
            <button
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border shadow-sm">
                    {photoURL ? (
                        <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {getInitials(displayName)}
                        </div>
                    )}
                </div>
                <span className="hidden sm:block text-sm font-medium truncate max-w-[100px]">
                    {displayName}
                </span>
                <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-4 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                                    {photoURL ? (
                                        <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {getInitials(displayName)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold truncate">{displayName}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-1.5">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg transition-colors group">
                                <UserIcon size={16} className="group-hover:text-primary transition-colors" />
                                <span>Profile</span>
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg transition-colors group">
                                <Settings size={16} className="group-hover:text-primary transition-colors" />
                                <span>Settings</span>
                            </button>
                        </div>

                        <div className="border-t border-border p-1.5">
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                onClick={handleSignOut}
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserMenu;
