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

                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileData) setProfile(profileData);

                // 2. Fetch Transactions
                const { data: txData } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                // 3. Fetch Wallets
                const { data: walletsData } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id);

                // 4. Fetch Goals
                const { data: goalsData } = await supabase
                    .from('goals')
                    .select('*')
                    .eq('user_id', user.id);

                // 5. Fetch Shopping Lists
                const { data: shoppingData } = await supabase
                    .from('shopping_lists')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                // 6. Fetch Recurring Templates
                const { data: recurringData } = await supabase
                    .from('recurring_templates')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('active', true);

                if (txData) {
                    setTransactions(txData);
                    // Calculate Balances per Wallet
                    const walletsWithBalance = (walletsData || []).map(wallet => {
                        const walletTx = txData.filter(tx => tx.wallet_id === wallet.id);
                        const currentBalance = walletTx.reduce((acc, tx) => {
                            const amt = Number(tx.amount);
                            if (tx.type === 'deposit' || tx.type === 'yield') return acc + amt;
                            if (tx.type === 'withdrawal' || tx.type === 'payment') return acc - amt;
                            return acc;
                        }, Number(wallet.initial_balance) || 0);
                        return { ...wallet, balance: currentBalance };
                    });

                    setWallets(walletsWithBalance);
                    setGoals(goalsData || []);

                    // Calculate Stats
                    const globalBalance = walletsWithBalance.reduce((acc, w) => acc + w.balance, 0);

                    const txBalance = txData.reduce((acc, tx) => {
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
                        totalBalance: globalBalance,
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
