import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardData } from '../../hooks/useDashboardData';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// New Components
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import KPIGrid from '../../components/analytics/KPIGrid';
import IncomeVsExpenseChart from '../../components/analytics/IncomeVsExpenseChart';
import CategoryBreakdown from '../../components/analytics/CategoryBreakdown';
import TopExpenses from '../../components/analytics/TopExpenses';
import FinancialHealth from '../../components/analytics/FinancialHealth';
import { DATE_RANGES, filterTransactionsByRange, filterTransactionsByWallet } from '../../components/analytics/AnalyticsHelpers';
import { differenceInDays, startOfDay } from 'date-fns';

const Analytics = () => {
    const { transactions, formatCurrency, loading, stats } = useDashboardData();
    const { user } = useAuth();
    const [wallets, setWallets] = useState([]);

    // Filter States
    const [currentRange, setCurrentRange] = useState(DATE_RANGES.MONTH);
    const [selectedWallet, setSelectedWallet] = useState('all');

    // Fetch Wallets for Selector
    useEffect(() => {
        if (user) {
            supabase.from('wallets').select('*').eq('user_id', user.id)
                .then(({ data }) => {
                    if (data) setWallets(data);
                });
        }
    }, [user]);

    // --- FILTERING LOGIC ---
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // 1. Filter by Range
        filtered = filterTransactionsByRange(filtered, currentRange);

        // 2. Filter by Wallet
        filtered = filterTransactionsByWallet(filtered, selectedWallet);

        return filtered;
    }, [transactions, currentRange, selectedWallet]);

    // --- KPI CALCULATION ---
    const kpis = useMemo(() => {
        const income = filteredTransactions
            .filter(tx => tx.type === 'deposit' || tx.type === 'yield')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        const expense = filteredTransactions
            .filter(tx => tx.type === 'withdrawal' || tx.type === 'payment')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        const netCashFlow = income - expense;
        const savingsRate = income > 0 ? ((netCashFlow) / income) * 100 : 0;

        // Daily Average Calculation
        let days = 1;
        if (currentRange === DATE_RANGES.TODAY) {
            days = 1;
        } else {
            days = Math.max(1, filteredTransactions.length > 0 ?
                differenceInDays(new Date(), new Date(filteredTransactions[filteredTransactions.length - 1]?.date || new Date()))
                : 30);

            if (currentRange === DATE_RANGES.WEEK) days = 7;
            if (currentRange === DATE_RANGES.MONTH) days = new Date().getDate();
        }

        const dailyAverage = expense / days;

        // Net Worth
        let currentNetWorth = stats.totalBalance;
        if (selectedWallet !== 'all') {
            const w = wallets.find(w => w.id === selectedWallet);
            // Recompute balance for specific wallet
            const wTxs = transactions.filter(tx => tx.wallet_id === w.id);
            const txBalance = wTxs.reduce((acc, tx) => {
                const amt = Number(tx.amount);
                if (tx.type === 'deposit' || tx.type === 'yield') return acc + amt;
                return acc - amt;
            }, 0);
            currentNetWorth = (Number(w.initial_balance) || 0) + txBalance;
        }

        return {
            income,
            expense,
            netCashFlow,
            savingsRate: savingsRate.toFixed(1),
            dailyAverage,
            netWorth: currentNetWorth
        };
    }, [filteredTransactions, currentRange, stats.totalBalance, selectedWallet, wallets, transactions]);


    return (
        <div className="space-y-8 pb-12 min-h-screen">
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-10">
                <h1 className="text-3xl font-bold text-white mb-2">Analíticas Avanzadas</h1>
                <p className="text-white/40">Visión profunda de tu salud financiera.</p>
            </div>

            {/* Filters */}
            <div className="relative z-20">
                <AnalyticsFilters
                    currentRange={currentRange}
                    onRangeChange={setCurrentRange}
                    selectedWallet={selectedWallet}
                    onWalletChange={setSelectedWallet}
                    wallets={wallets}
                />
            </div>

            {/* KPI Grid */}
            <div className="relative z-10">
                <KPIGrid kpis={kpis} formatCurrency={formatCurrency} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <IncomeVsExpenseChart
                    transactions={filteredTransactions}
                    currentRange={currentRange}
                    formatCurrency={formatCurrency}
                />
                <CategoryBreakdown
                    transactions={filteredTransactions}
                    formatCurrency={formatCurrency}
                />
            </div>

            {/* Top Expenses & Health Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <TopExpenses
                    transactions={filteredTransactions}
                    formatCurrency={formatCurrency}
                />
                <FinancialHealth kpis={kpis} />
            </div>

        </div>
    );
};

export default Analytics;
