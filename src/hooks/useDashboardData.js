import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useDashboardData = (refreshKey = 0) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({
        totalBalance: 0,
        totalProfit: 0,
        activeVaults: 0,
        apy: 12.5 // Static for now or calculated
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Profile (Secure RPC)
                const { data: profileData, error: profileError } = await supabase
                    .rpc('get_profile_secure', { p_user_id: user.id });

                // RPC returns a set (array) even if it's one row, normally. 
                // However, profile RPC might return 0 or 1 row.
                // Let's handle it as an array or single object depending on RPC definition.
                // Our RPC returns SETOF profiles.

                if (profileData && profileData.length > 0) setProfile(profileData[0]);

                // 2. Fetch Transactions (Secure RPC)
                const { data: txData } = await supabase
                    .rpc('get_transactions_secure', { p_user_id: user.id });

                // 3. Fetch Wallets (Secure RPC)
                const { data: walletsData } = await supabase
                    .rpc('get_wallets_secure', { p_user_id: user.id });

                // 4. Fetch Goals (Secure RPC)
                const { data: goalsData } = await supabase
                    .rpc('get_goals_secure', { p_user_id: user.id });

                if (txData) {
                    setTransactions(txData);
                    setWallets(walletsData || []);
                    setGoals(goalsData || []);

                    // Calculate Stats
                    const balance = txData.reduce((acc, tx) => {
                        if (tx.type === 'deposit' || tx.type === 'yield') return acc + Number(tx.amount);
                        if (tx.type === 'withdrawal') return acc - Number(tx.amount);
                        if (tx.type === 'payment') return acc - Number(tx.amount);
                        return acc;
                    }, 0);

                    const profit = txData
                        .filter(tx => tx.type === 'yield')
                        .reduce((acc, tx) => acc + Number(tx.amount), 0);

                    setStats(prev => ({
                        ...prev,
                        totalBalance: balance,
                        totalProfit: profit,
                        activeVaults: txData.filter(tx => tx.type === 'investment').length
                    }));
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [user, refreshKey]); // Depend on refreshKey

    // Helper to format currency based on user profile
    const formatCurrency = (amount) => {
        const currency = profile?.currency || 'USD';
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    return { profile, transactions, wallets, goals, stats, loading, formatCurrency };
};
