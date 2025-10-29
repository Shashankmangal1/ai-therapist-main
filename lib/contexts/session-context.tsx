'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type BasicUser = {
    id: string;
    name?: string | null;
    email?: string | null;
} | null;

type SessionContextValue = {
    isAuthenticated: boolean;
    user: BasicUser;
    login: (user: BasicUser) => void;
    logout: () => void;
};

const defaultSession: SessionContextValue = {
    isAuthenticated: false,
    user: null,
    login: () => {},
    logout: () => {},
};

const SessionContext = createContext<SessionContextValue>(defaultSession);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<BasicUser>(null);

    const value = useMemo<SessionContextValue>(() => ({
        isAuthenticated: !!user,
        user,
        login: setUser,
        logout: () => setUser(null),
    }), [user]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession(): SessionContextValue {
    return useContext(SessionContext);
}


