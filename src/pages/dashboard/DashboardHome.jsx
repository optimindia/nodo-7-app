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

const DashboardHome = ({ searchQuery: globalSearchQuery, stats, transactions, wallets, goals, loading, formatCurrency }) => {
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

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Actions */}
            <AnimatePresence>
                {!isSearching && !showAllHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-end overflow-hidden"
                    >
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all font-bold text-sm mb-4"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Transacción
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsible Stats & Charts Section - Hide when searching or showing full history */}
            <AnimatePresence>
                {!isSearching && !showAllHistory && (
                    <motion.div
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        className="space-y-8 overflow-hidden"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard
                                title="Balance Total"
                                value={formatCurrency(stats.totalBalance)}
                                trend={stats.totalBalance >= 0 ? "up" : "down"}
                                trendValue="--"
                                icon={Wallet}
                                delay={0}
                            />
                            <StatsCard
                                title="Beneficio Total"
                                value={formatCurrency(stats.totalProfit)}
                                trend={stats.totalProfit >= 0 ? "up" : "down"}
                                trendValue="--"
                                icon={ArrowUpRight}
                                delay={0.1}
                            />
                            <StatsCard
                                title="Transacciones"
                                value={transactions.length}
                                trend="up"
                                trendValue="--"
                                icon={Users}
                                delay={0.2}
                            />
                            <StatsCard
                                title="Último Ingreso"
                                value={transactions.find(t => t.type === 'deposit')?.amount ? `+$${transactions.find(t => t.type === 'deposit').amount}` : '--'}
                                trend="up"
                                trendValue="Hoy"
                                icon={TrendingUp}
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

