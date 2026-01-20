import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useAdminData = (page = 1, perPage = 10, searchTerm = '') => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCredits: 0,
        myCredits: 0,
        activeUsers: 0,
        resellers: 0
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch My Profile Check (Lightweight)
            const { data: myProfile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            // 2. Optimized Parallel Fetching: Users + Stats
            const from = (page - 1) * perPage;
            const to = from + perPage - 1;

            // Prepare Query for Users
            // Note: We use the 'Strict Hierarchy' RLS, so simple select is safe.
            let query = supabase
                .from('profiles')
                .select('id, email, role, credits, subscription_status, created_by, created_at, has_completed_setup', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Apply Search if exists (Simple email filter)
            if (searchTerm) {
                query = query.ilike('email', `%${searchTerm}%`);
            }

            // Execute Promises
            const [usersResult, statsResult] = await Promise.all([
                query,
                supabase.rpc('get_admin_stats')
            ]);

            if (usersResult.error) throw usersResult.error;
            if (statsResult.error) throw statsResult.error;

            let fetchedUsers = usersResult.data || [];

            // --- CLIENT SIDE SAFETY NET (RESTORED) ---
            // Critical: If RLS is not active/working, this prevents data leaks.
            if (myProfile?.role === 'reseller') {
                fetchedUsers = fetchedUsers.filter(u => u.created_by === user.id || u.id === user.id);
            }

            setUsers(fetchedUsers);
            setTotalRecords(usersResult.count || 0);

            // Set Stats from RPC
            setStats(statsResult.data);

            // Set Profile Role (for UI logic)
            // Note: get_admin_stats returns myCredits, so we include it in the profile object for easy access
            setCurrentUserProfile({ ...myProfile, id: user.id, credits: statsResult.data.myCredits });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, perPage, searchTerm, authUser]); // Refetch when params change

    const refreshData = fetchData;

    return { users, stats, currentUserProfile, loading, refreshData, totalRecords };
};
