
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check for Custom Session (Emergency Mode)
        const customSession = localStorage.getItem('custom_session');
        if (customSession) {
            try {
                const parsedSession = JSON.parse(customSession);
                setUser(parsedSession.user);
                setSession(parsedSession);
                setLoading(false);
                return; // Stop here if custom session exists
            } catch (e) {
                console.error("Invalid custom session", e);
                localStorage.removeItem('custom_session');
            }
        }

        // 2. Standard Supabase Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!localStorage.getItem('custom_session')) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password) => {
        return supabase.auth.signUp({ email, password });
    };

    const signIn = async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const customLogin = async (email, password) => {
        const { data, error } = await supabase.rpc('verify_user_custom', {
            input_email: email,
            input_password: password
        });

        if (error) return { error };
        if (!data.success) return { error: { message: data.message } };

        // Success: Create Fake Session
        const fakeUser = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            app_metadata: { role: data.user.role },
            user_metadata: { role: data.user.role },
            aud: 'authenticated',
            created_at: new Date().toISOString()
        };

        const fakeSession = {
            access_token: 'custom-token-placeholder',
            token_type: 'bearer',
            expires_in: 3600 * 24 * 7,
            refresh_token: 'custom-refresh-placeholder',
            user: fakeUser
        };

        // Persist
        localStorage.setItem('custom_session', JSON.stringify(fakeSession));

        // Update State
        setUser(fakeUser);
        setSession(fakeSession);

        return { data: { session: fakeSession, user: fakeUser }, error: null };
    };

    const signOut = async () => {
        localStorage.removeItem('custom_session');
        setUser(null);
        setSession(null);
        return supabase.auth.signOut();
    };

    const value = {
        signUp,
        signIn,
        customLogin,
        signOut,
        user,
        session,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
