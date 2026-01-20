import React, { useState } from 'react';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartSection from '../../components/dashboard/ChartSection';
import MonthlySummary from '../../components/dashboard/MonthlySummary';
import ComparisonChart from '../../components/dashboard/ComparisonChart';
import CompositionChart from '../../components/dashboard/CompositionChart';
import TransactionModal from '../../components/dashboard/TransactionModal';
import EpicButton from '../../components/ui/EpicButton';
import AdvancedSearch from '../../components/dashboard/AdvancedSearch';
import { Wallet, Users, ArrowUpRight, TrendingUp, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

const DashboardHome = ({
    searchQuery: globalSearchQuery,
    stats = { totalBalance: 0 },
    transactions = [],
    wallets = [],
    goals = [],
    loading = false,
    formatCurrency
}) => {
    // Props are now passed from Layout to avoid double fetching and enable global access

    // We can keep these local UI states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);

    // Local Search & Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, deposit, withdrawal
    const [filters, setFilters] = useState({
        walletId: null,
        minAmount: '',
        maxAmount: '',
        dateRange: null // '7days', '30days'
    });

    // View Mode
    const [showAllHistory, setShowAllHistory] = useState(false);

    // NEW: Time Range State (Moved to top to fix Hook Rule)
    const [timeRange, setTimeRange] = useState('this_month'); // 'this_month', 'last_month', 'last_30_days', 'this_week', 'today', 'year'
    const [statView, setStatView] = useState('expense'); // 'expense' | 'income'

    const handleTransactionSuccess = () => {
        // Trigger generic refresh? 
        // Ideally, we should have a 'refetch' prop passed down from layout if we need manual refresh, 
        // but real-time subscription in layout might handle it automatically?
        // For now, let's assume layout handles it or we reload page.
        // Actually best to reload for guarantees until RT is perfect:
        window.location.reload();
    };

    const handleEdit = (tx) => {
        setTransactionToEdit(tx);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;

        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            window.location.reload(); // Simple refresh
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTransactionToEdit(null);
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
        );
    }

    // Determine if we are in "Search Mode"
    // Use either the local search query OR the one passed from global layout if provided
    const activeSearchQuery = searchQuery || globalSearchQuery;
    const isSearching = !!activeSearchQuery || filterType !== 'all' || filters.walletId || filters.minAmount || filters.maxAmount || filters.dateRange;

    // Filter Logic
    const filteredTransactions = transactions.filter(tx => {
        // 1. Text Search
        const matchesSearch = !activeSearchQuery ||
            (tx.description && tx.description.toLowerCase().includes(activeSearchQuery.toLowerCase())) ||
            (tx.category && tx.category.toLowerCase().includes(activeSearchQuery.toLowerCase())) ||
            (tx.type === 'deposit' ? 'ingreso' : 'gasto').includes(activeSearchQuery.toLowerCase());

        // 2. Type Filter
        const matchesType = filterType === 'all' ||
            (filterType === 'deposit' ? (tx.type === 'deposit' || tx.type === 'yield') : (tx.type === 'withdrawal' || tx.type === 'payment'));

        // 3. Wallet Filter
        const matchesWallet = !filters.walletId || tx.wallet_id === filters.walletId;

        // 4. Amount Filter
        const matchesMinAmount = !filters.minAmount || tx.amount >= parseFloat(filters.minAmount);
        const matchesMaxAmount = !filters.maxAmount || tx.amount <= parseFloat(filters.maxAmount);

        // 5. Date Filter (Simplified)
        let matchesDate = true;
        if (filters.dateRange) {
            const txDate = new Date(tx.date || tx.created_at);
            const now = new Date();
            const daysDiff = (now - txDate) / (1000 * 60 * 60 * 24);
            if (filters.dateRange === '7days' && daysDiff > 7) matchesDate = false;
            if (filters.dateRange === '30days' && daysDiff > 30) matchesDate = false;
        }

        return matchesSearch && matchesType && matchesWallet && matchesMinAmount && matchesMaxAmount && matchesDate;
    });

    // Helper: Calculate Stats based on Time Range
    const calculateStats = (txs, range) => {
        const now = new Date();
        let currentStart, currentEnd, prevStart, prevEnd;

        // 1. Define Date Ranges
        if (range === 'this_month') {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (range === 'last_month') {
            currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
        } else if (range === 'last_30_days') {
            currentEnd = now;
            currentStart = new Date(now);
            currentStart.setDate(now.getDate() - 30);
            prevEnd = new Date(currentStart);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevEnd.getDate() - 30);
        } else if (range === 'this_week') {
            const day = now.getDay() || 7; // Mon=1, Sun=7
            currentStart = new Date(now);
            currentStart.setHours(0, 0, 0, 0);
            currentStart.setDate(now.getDate() - day + 1); // Monday
            currentEnd = new Date(); // Up to now

            prevStart = new Date(currentStart);
            prevStart.setDate(prevStart.getDate() - 7);
            prevEnd = new Date(currentStart);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
        } else if (range === 'today') {
            currentStart = new Date(now.setHours(0, 0, 0, 0));
            currentEnd = new Date();
            prevStart = new Date(currentStart);
            prevStart.setDate(prevStart.getDate() - 1);
            prevEnd = new Date(prevStart);
            prevStart.setDate(prevEnd.getDate() - 1); // Fix previous day end
            prevEnd.setHours(23, 59, 59, 999);
        } else if (range === 'year') {
            currentStart = new Date(now.getFullYear(), 0, 1);
            currentEnd = now;
            prevStart = new Date(now.getFullYear() - 1, 0, 1);
            prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        }

        const filterByRange = (items, start, end) => {
            return items.filter(tx => {
                const d = new Date(tx.date || tx.created_at);
                return d >= start && d <= end;
            });
        };

        const currentTxs = filterByRange(txs, currentStart, currentEnd);
        const prevTxs = filterByRange(txs, prevStart, prevEnd);

        const sum = (items, type) => items.reduce((acc, tx) => {
            if (type === 'income') return (tx.type === 'deposit' || tx.type === 'yield') ? acc + Number(tx.amount) : acc;
            if (type === 'expense') return (tx.type === 'withdrawal' || tx.type === 'payment') ? acc + Number(tx.amount) : acc;
            return acc;
        }, 0);

        const currentIncome = sum(currentTxs, 'income');
        const currentExpense = sum(currentTxs, 'expense');
        const prevIncome = sum(prevTxs, 'income');
        const prevExpense = sum(prevTxs, 'expense');

        const calcChange = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        return {
            income: { value: currentIncome, change: calcChange(currentIncome, prevIncome) },
            expenses: { value: currentExpense, change: calcChange(currentExpense, prevExpense) },
            transactions: { value: currentTxs.length, change: calcChange(currentTxs.length, prevTxs.length) },
            balanceChange: { value: currentIncome - currentExpense, label: range === 'this_month' ? 'Flujo Neto (Mes)' : 'Flujo Neto' }
        };
    };

    const dynamicStats = calculateStats(transactions, timeRange);

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Actions */}
            <AnimatePresence>
                {!isSearching && !showAllHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4"
                    >
                        {/* Time Range Selector */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit overflow-x-auto max-w-full">
                            {[
                                { id: 'today', label: 'Hoy' },
                                { id: 'this_week', label: 'Semana' },
                                { id: 'this_month', label: 'Este Mes' },
                                { id: 'last_month', label: 'Mes Pasado' },
                                { id: 'last_30_days', label: '30 Días' },
                                { id: 'year', label: 'Año' }
                            ].map(range => (
                                <button
                                    key={range.id}
                                    onClick={() => setTimeRange(range.id)}
                                    className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${timeRange === range.id
                                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all font-bold text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Transacción
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsible Stats & Charts Section */}
            <AnimatePresence>
                {!isSearching && !showAllHistory && (
                    <motion.div
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        className="space-y-8" // Removed overflow-hidden to fix clipping
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: Balance */}
                            <StatsCard
                                title="Balance Total"
                                value={formatCurrency(stats.totalBalance)}
                                trend={dynamicStats.income.value >= dynamicStats.expenses.value ? "up" : "down"}
                                trendValue="--"
                                icon={Wallet}
                                delay={0}
                            />

                            {/* Card 2: Dynamic (Expenses or Income) */}
                            <div className="relative group">
                                <StatsCard
                                    title={
                                        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 w-fit">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setStatView('expense'); }}
                                                className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md transition-all ${statView === 'expense' ? 'bg-rose-500/20 text-rose-300 shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                            >
                                                Gastos
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setStatView('income'); }}
                                                className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md transition-all ${statView === 'income' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                            >
                                                Ingresos
                                            </button>
                                        </div>
                                    }
                                    value={formatCurrency(statView === 'expense' ? dynamicStats.expenses.value : dynamicStats.income.value)}
                                    trend={statView === 'expense'
                                        ? (dynamicStats.expenses.change > 0 ? "up" : "down")
                                        : (dynamicStats.income.change >= 0 ? "up" : "down")}
                                    trendValue={`${Math.abs(statView === 'expense' ? dynamicStats.expenses.change : dynamicStats.income.change).toFixed(1)}%`}
                                    inverseTrend={statView === 'expense'}
                                    icon={statView === 'expense' ? ArrowUpRight : TrendingUp}
                                    delay={0.1}
                                />
                            </div>

                            {/* Card 3: Daily Average */}
                            <StatsCard
                                title="Promedio Diario"
                                value={formatCurrency((dynamicStats.expenses.value + dynamicStats.income.value) / (timeRange === 'today' ? 1 : 30))} // Very rough
                                trend="up"
                                trendValue="Est."
                                icon={TrendingUp}
                                delay={0.2}
                            />

                            {/* Card 4: Net Flow */}
                            <StatsCard
                                title="Flujo Neto"
                                value={formatCurrency(dynamicStats.balanceChange.value)}
                                trend={dynamicStats.balanceChange.value >= 0 ? "up" : "down"}
                                trendValue={dynamicStats.balanceChange.value >= 0 ? "+Ganancia" : "-Pérdida"}
                                icon={Users}
                                delay={0.3}
                            />
                        </div>

                        {/* Main Chart + Widgets Area */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2">
                                <ChartSection transactions={transactions} formatCurrency={formatCurrency} />
                            </div>
                            <div className="xl:col-span-1">
                                <MonthlySummary transactions={transactions} formatCurrency={formatCurrency} />
                            </div>
                        </div>

                        {/* Analytics Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <ComparisonChart transactions={transactions} formatCurrency={formatCurrency} />
                            </div>
                            <div className="lg:col-span-1">
                                <CompositionChart transactions={transactions} formatCurrency={formatCurrency} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Smart List Container */}
            <LayoutGroup>
                <div className="w-full relative">

                    {/* SEARCH BAR AREA */}
                    <div className="mb-6">
                        <AdvancedSearch
                            searchQuery={activeSearchQuery}
                            setSearchQuery={setSearchQuery}
                            filterType={filterType}
                            setFilterType={setFilterType}
                            filters={filters}
                            setFilters={setFilters}
                            wallets={wallets}
                        />
                    </div>

                    <motion.div
                        layout
                        className={`w-full glass-panel rounded-[2rem] border border-white/10 bg-[#0A0F1E]/60 backdrop-blur-2xl flex flex-col shadow-2xl relative overflow-hidden transition-all duration-500 ${isSearching || showAllHistory ? 'min-h-[80vh]' : ''}`}
                    >
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="p-8 pb-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 relative z-10">
                                <motion.h3 layout="position" className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className={`w-1 h-6 rounded-full transition-colors ${isSearching ? 'bg-purple-500' : 'bg-cyan-500'}`} />
                                    {isSearching ? (
                                        <span className="flex items-center gap-2">
                                            Resultados de búsqueda
                                            <span className="text-sm font-normal text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{filteredTransactions.length} total</span>
                                        </span>
                                    ) : showAllHistory ? 'Historial Completo' : 'Movimientos Recientes'}
                                </motion.h3>

                                <div className="flex items-center gap-4">
                                    {!isSearching && (
                                        <EpicButton
                                            active={showAllHistory}
                                            label={showAllHistory ? "Mostrar Menos" : "Ver Todo"}
                                            onClick={() => setShowAllHistory(!showAllHistory)}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            {(isSearching || showAllHistory) && <motion.div layout className="h-px w-full bg-white/10 mb-4" />}
                        </div>

                        {/* Transaction List */}
                        <div className="space-y-2 relative z-10 px-4 md:px-8 pb-8">
                            <AnimatePresence mode='popLayout'>
                                {(() => {
                                    if (filteredTransactions.length === 0) {
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="text-white/40 text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-white/5 mx-4"
                                            >
                                                <p className="mb-3 text-lg">{isSearching ? 'No encontramos coincidencias 🔍' : 'No hay movimientos aún'}</p>
                                                {!isSearching && (
                                                    <button
                                                        onClick={() => setIsModalOpen(true)}
                                                        className="text-sm text-black font-bold bg-cyan-400 px-6 py-2 rounded-full hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                                    >
                                                        + Crear Nuevo
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    }

                                    // Limit items if NOT searching and NOT showing all history
                                    const itemsToShow = (isSearching || showAllHistory) ? filteredTransactions : filteredTransactions.slice(0, 5);

                                    return itemsToShow.map((tx, i) => {
                                        const isIncome = tx.type === 'deposit' || tx.type === 'yield';
                                        const wallet = wallets.find(w => w.id === tx.wallet_id);
                                        const goal = goals.find(g => g.id === tx.goal_id);

                                        return (
                                            <motion.div
                                                layout
                                                key={tx.id || i}
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                className="relative p-5 rounded-3xl bg-white/5 border border-white/5 transition-all group cursor-default overflow-hidden"
                                            >
                                                {/* Wallet Color Indicator Strip */}
                                                {wallet && (
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1"
                                                        style={{ backgroundColor: wallet.color || '#fff' }}
                                                    />
                                                )}

                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 justify-between relative z-10 pl-2">

                                                    {/* LEFT SIDE: Icon + Info */}
                                                    <div className="flex items-start gap-4">
                                                        {/* Icon */}
                                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${isIncome
                                                            ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
                                                            : 'bg-rose-500/10 text-rose-400 shadow-rose-500/10'
                                                            }`}>
                                                            <ArrowUpRight className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5px] ${!isIncome ? 'rotate-45' : 'rotate-[135deg]'}`} />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Title Row */}
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="text-base sm:text-lg font-bold text-white truncate break-words">
                                                                    {tx.description || tx.category || (isIncome ? 'Ingreso' : 'Gasto')}
                                                                </div>

                                                                {/* MOBILE ONLY: Amount */}
                                                                <span className={`sm:hidden text-lg font-bold tabular-nums tracking-tight whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-white'
                                                                    }`}>
                                                                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                                                </span>
                                                            </div>

                                                            {/* Badges Row - Wrap on mobile */}
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${isIncome ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                                    }`}>
                                                                    {tx.type === 'deposit' ? 'Ingreso' : tx.type === 'yield' ? 'Rendimiento' : 'Gasto'}
                                                                </span>

                                                                {wallet && (
                                                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border bg-white/5 border-white/10 text-white/60">
                                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: wallet.color }} />
                                                                        {wallet.name}
                                                                    </span>
                                                                )}

                                                                {goal && (
                                                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border bg-purple-500/10 border-purple-500/20 text-purple-400">
                                                                        🎯 {goal.title}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Date - Below badges on mobile */}
                                                            <div className="mt-2 sm:hidden text-xs text-white/30 font-medium">
                                                                {new Date(tx.date || tx.created_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT SIDE (Desktop): Amount + Date + Actions */}
                                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/10 sm:border-0">
                                                        {/* Actions (Mobile: Left aligned in footer / Desktop: Right aligned) */}
                                                        <div className={`sm:hidden flex items-center gap-2`}>
                                                            <button onClick={() => handleEdit(tx)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors">
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(tx.id)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Desktop Content Group */}
                                                        <div className="hidden sm:flex items-center gap-6">
                                                            <span className="text-xs text-white/30 font-medium">
                                                                {new Date(tx.date || tx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                            </span>

                                                            <span className={`text-xl font-bold tabular-nums tracking-tight ${isIncome ? 'text-emerald-400' : 'text-white'
                                                                }`}>
                                                                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                                            </span>

                                                            <div className={`flex items-center gap-2 transition-all transform ${isSearching || showAllHistory ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                                                                <button onClick={() => handleEdit(tx)} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors">
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(tx.id)} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    });
                                })()}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </LayoutGroup>

            <TransactionModal
                key={transactionToEdit ? transactionToEdit.id : 'new-transaction'}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onTransactionAdded={handleTransactionSuccess}
                initialData={transactionToEdit}
                userId={null} // Auth handled internally now
            />
        </div>
    );
};

export default DashboardHome;

