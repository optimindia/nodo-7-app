import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, DollarSign, Wallet, Tag, X } from 'lucide-react';

const AdvancedSearch = ({
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filters,
    setFilters,
    wallets = [],
    categories = [] // Assuming you might have a list of categories
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper to toggle array based filters if needed, or just set scalar values
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === prev[key] ? null : value // Toggle off if same clicked
        }));
    };

    return (
        <div className="w-full space-y-4">
            {/* Main Large Search Bar */}
            <motion.div
                layout
                className={`
                    relative flex items-center w-full bg-[#0F172A] border border-cyan-500/30 rounded-2xl 
                    shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300
                    focus-within:border-cyan-500 focus-within:shadow-[0_0_25px_rgba(34,211,238,0.2)]
                    ${isExpanded ? 'p-1' : 'p-1'}
                `}
            >
                <div className="pl-4 pr-2 text-cyan-400">
                    <Search className="w-6 h-6" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="Buscar por nombre, categoría, monto..."
                    className="w-full bg-transparent border-none text-white text-lg placeholder-white/30 focus:ring-0 p-3"
                />

                {/* Clear Button */}
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Filter Toggle Trigger */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
                        p-3 rounded-xl m-1 transition-all flex items-center gap-2 font-medium text-sm
                        ${isExpanded
                            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }
                    `}
                >
                    <Filter className="w-4 h-4" />
                    <span className="hidden md:block">Filtros</span>
                </button>
            </motion.div>

            {/* Expanded Filters Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shadow-xl">

                            {/* Type Filter */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Tipo
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'deposit', 'withdrawal'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                                ${filterType === type
                                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                    : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                                                }
                                            `}
                                        >
                                            {type === 'all' ? 'Todo' : type === 'deposit' ? 'Ingresos' : 'Gastos'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Wallet Filter */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                    <Wallet className="w-3 h-3" /> Billetera
                                </label>
                                <select
                                    value={filters.walletId || ''}
                                    onChange={(e) => handleFilterChange('walletId', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                >
                                    <option value="">Todas las billeteras</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id} className="bg-[#0F172A]">{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range (Simplified as presets for now) */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Fecha
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleFilterChange('dateRange', '7days')}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border ${filters.dateRange === '7days' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
                                    >
                                        Últimos 7 días
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('dateRange', '30days')}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border ${filters.dateRange === '30days' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
                                    >
                                        Este Mes
                                    </button>
                                </div>
                            </div>

                            {/* Amount (Simplified) */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Monto
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minAmount || ''}
                                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxAmount || ''}
                                        onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdvancedSearch;
