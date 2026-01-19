import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Wallet, ChevronDown, Filter } from 'lucide-react';
import { DATE_RANGES } from './AnalyticsHelpers';

const AnalyticsFilters = ({
    currentRange,
    onRangeChange,
    selectedWallet,
    onWalletChange,
    wallets
}) => {

    const ranges = [
        { id: DATE_RANGES.TODAY, label: 'Hoy' },
        { id: DATE_RANGES.WEEK, label: 'Semana' },
        { id: DATE_RANGES.MONTH, label: 'Mes Actual' },
        { id: DATE_RANGES.LAST_3_MONTHS, label: '3 Meses' },
        { id: DATE_RANGES.YEAR, label: 'Este Año' },
        { id: DATE_RANGES.ALL, label: 'Histórico' },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 p-1">

            {/* Date Range Selectors */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto custom-scrollbar">
                {ranges.map((range) => (
                    <button
                        key={range.id}
                        onClick={() => onRangeChange(range.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${currentRange === range.id
                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Wallet Selector & More Filters */}
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <select
                        value={selectedWallet}
                        onChange={(e) => onWalletChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        <option value="all">Todas las Billeteras</option>
                        {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsFilters;
