
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [hasCompletedSetup, setHasCompletedSetup] = useState(true); // Default true to avoid flickering wizard if check fails/delays, will update on check

    const checkUserStatus = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('subscription_status, has_completed_setup')
                .eq('id', userId)
                .single();

            if (data) {
                if (data.subscription_status === 'inactive') {
                    setIsBlocked(true);
                } else {
                    setIsBlocked(false);
                }

                // If has_completed_setup is explicitly false, set it. 
                // If it's null (new col) or true, assume true for now to be safe, OR force setup?
                // Let's force setup if it's strictly false.
                setHasCompletedSetup(data.has_completed_setup === true);
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
        isBlocked,
        hasCompletedSetup,
        setHasCompletedSetup
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
