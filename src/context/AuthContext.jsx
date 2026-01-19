
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    const checkUserStatus = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('subscription_status')
                .eq('id', userId)
                .single();

            if (data?.subscription_status === 'inactive') {
                setIsBlocked(true);
            } else {
                setIsBlocked(false);
            }
        } catch (err) {
            console.error("Error checking user status:", err);
            // Default to safe access if error, or strict? Let's assume safe for now unless explicit block
        }
    };

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserStatus(session.user.id);
            }
            setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserStatus(session.user.id);
            } else {
                setIsBlocked(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        signIn,
        signOut,
        loading,
        isBlocked
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
