import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useUserRole = () => {
    const { user } = useAuth();
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setRole(null);
            setLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setRole(data?.role || 'client');
            } catch (err) {
                console.error('Error fetching role:', err);
                setError(err);
                // Default to client on error to verify safe fallback
                setRole('client');
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [user]);

    // Role helpers
    const isAdmin = role === 'admin';
    const isReseller = role === 'reseller';
    const isClient = role === 'client';
    const canManageUsers = isAdmin || isReseller;

    return {
        role,
        loading,
        error,
        isAdmin,
        isReseller,
        isClient,
        canManageUsers
    };
};
