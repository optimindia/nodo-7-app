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
    const [timeRange, setTimeRange] = useState('this_month'); // 'this_month', 'last_month', 'custom', 'this_week', 'today', 'year'
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
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
        } else if (range === 'custom') {
            if (!customDateRange.start || !customDateRange.end) {
                // If no date selected, show all or nothing? Let's default to nothing or current month to avoid errors
                // For now, return safety dates
                currentStart = new Date();
                currentEnd = new Date();
                prevStart = new Date();
                prevEnd = new Date();
            } else {
                currentStart = new Date(customDateRange.start);
                // Adjust for local time zone - if user picks '2023-01-01', it considers UTC 00:00 usually. 
                // Let's assume input value 'YYYY-MM-DD' is local start of day.
                // We want end of day for the end date.
                const endDate = new Date(customDateRange.end);
                // Fix timezone offset for simple string parsing or set hours
                currentStart.setHours(0, 0, 0, 0);

                currentEnd = new Date(customDateRange.end);
                currentEnd.setHours(23, 59, 59, 999);

                // Calculate previous period duration
                const duration = currentEnd - currentStart; // in ms
                prevEnd = new Date(currentStart.getTime() - 1);
                prevStart = new Date(prevEnd.getTime() - duration);
            }
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

    const getComparisonLabel = (range) => {
        switch (range) {
            case 'today': return 'vs ayer';
            case 'this_week': return 'vs semana anterior';
            case 'this_month': return 'vs mes anterior';
            case 'last_month': return 'vs mes anterior';
            case 'year': return 'vs año anterior';
            case 'custom': return 'vs periodo anterior';
            default: return 'vs periodo anterior';
        }
    };

    const comparisonLabel = getComparisonLabel(timeRange);

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Actions */}
            <AnimatePresence>
                {!isSearching && !showAllHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-4 mb-4"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Time Range Selector */}
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit overflow-x-auto max-w-full">
                                {[
                                    { id: 'today', label: 'Hoy' },
                                    { id: 'this_week', label: 'Semana' },
                                    { id: 'this_month', label: 'Este Mes' },
                                    { id: 'last_month', label: 'Mes Pasado' },
                                    { id: 'custom', label: 'Personalizado' }, // Replaced last_30_days
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
                        </div>

                        {/* Custom Date Inputs */}
                        {timeRange === 'custom' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10 w-fit"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-white/40 text-xs font-bold uppercase">Desde:</span>
                                    <input
                                        type="date"
                                        value={customDateRange.start}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white/40 text-xs font-bold uppercase">Hasta:</span>
                                    <input
                                        type="date"
                                        value={customDateRange.end}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                            </motion.div>
                        )}
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
                                comparisonLabel={comparisonLabel}
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
                                    comparisonLabel={comparisonLabel}
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
                                comparisonLabel={comparisonLabel}
                            />

                            {/* Card 4: Net Flow */}
                            <StatsCard
                                title="Flujo Neto"
                                value={formatCurrency(dynamicStats.balanceChange.value)}
                                trend={dynamicStats.balanceChange.value >= 0 ? "up" : "down"}
                                trendValue={dynamicStats.balanceChange.value >= 0 ? "+Ganancia" : "-Pérdida"}
                                icon={Users}
                                delay={0.3}
                                comparisonLabel={comparisonLabel}
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
                                <CompositionChart wallets={wallets} formatCurrency={formatCurrency} />
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
                                                className="relative p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 transition-all group cursor-default overflow-hidden"
                                            >
                                                {/* Wallet Color Indicator Strip */}
                                                {wallet && (
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1"
                                                        style={{ backgroundColor: wallet.color || '#fff' }}
                                                    />
                                                )}

                                                {/* COMPACT ROW LAYOUT */}
                                                <div className="flex items-center gap-3 sm:gap-4 pl-2 relative z-10">

                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${isIncome
                                                        ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
                                                        : 'bg-rose-500/10 text-rose-400 shadow-rose-500/10'
                                                        }`}>
                                                        <ArrowUpRight className={`w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5px] ${!isIncome ? 'rotate-45' : 'rotate-[135deg]'}`} />
                                                    </div>

                                                    {/* Content Container */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">

                                                        {/* Top Row: Title & Amount */}
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="font-bold text-white text-sm sm:text-lg truncate leading-tight">
                                                                {tx.description || tx.category || (isIncome ? 'Ingreso' : 'Gasto')}
                                                            </div>
                                                            <span className={`font-bold text-sm sm:text-xl tabular-nums tracking-tight whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                                                                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                                            </span>
                                                        </div>

                                                        {/* Bottom Row: Metadata & Actions */}
                                                        <div className="flex justify-between items-end mt-1 sm:mt-2">

                                                            {/* Meta: Date + Badges */}
                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 font-medium">
                                                                <span className="truncate">
                                                                    {new Date(tx.date || tx.created_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                </span>

                                                                {/* Mobile: Compact Wallet Dot */}
                                                                {wallet && (
                                                                    <div className="flex items-center gap-1 sm:hidden">
                                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: wallet.color }} />
                                                                        <span className="truncate max-w-[80px]">{wallet.name}</span>
                                                                    </div>
                                                                )}

                                                                {/* Desktop: Full Badges (Restoring original desktop badge logic if needed, or keeping it clean) */}
                                                                {/* We can keep the original badge logic hidden on mobile and visible on desktop */}
                                                                <div className="hidden sm:flex items-center gap-2">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${isIncome ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                                                        {tx.type === 'deposit' ? 'Ingreso' : tx.type === 'yield' ? 'Rendimiento' : 'Gasto'}
                                                                    </span>
                                                                    {wallet && (
                                                                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border bg-white/5 border-white/10 text-white/60">
                                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: wallet.color }} />
                                                                            {wallet.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions (Mobile: Compact Inline | Desktop: Standard) */}
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                {/* Mobile Actions: Simple icons */}
                                                                <div className="flex sm:hidden items-center gap-3 ml-2">
                                                                    <button onClick={() => handleEdit(tx)} className="text-white/30 hover:text-cyan-400 p-1">
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(tx.id)} className="text-white/30 hover:text-rose-400 p-1">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>

                                                                {/* Desktop Actions: The fancy ones */}
                                                                <div className={`hidden sm:flex items-center gap-2 transition-all transform ${isSearching || showAllHistory ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
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

