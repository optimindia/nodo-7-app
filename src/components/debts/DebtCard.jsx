import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Calendar, AlertCircle } from 'lucide-react';

const DebtCard = ({ debt, onDelete }) => {
    // Helper
    const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

    // Calculate progress safe
    const current = safeNum(debt.current_balance);
    const original = safeNum(debt.total_amount) || current; // If total_amount is 0/missing, assume current

    // Prevent div by zero
    const progress = original > 0.01 ? ((original - current) / original) * 100 : 0;

    // Determine status color
    const isPaidOff = current <= 0.01;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-5 rounded-2xl border transition-all overflow-hidden group ${isPaidOff ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#1e293b] border-white/10 hover:border-red-500/30'}`}
        >
            {/* Background Gradient Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -translate-y-10 translate-x-10 transition-colors ${isPaidOff ? 'bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className={`font-bold text-lg ${isPaidOff ? 'text-emerald-400' : 'text-white'}`}>{debt.name}</h3>
                        <p className="text-xs text-white/40 font-mono">
                            Interés: <span className="text-white/60">{debt.interest_rate}%</span>
                        </p>
                    </div>
                    {isPaidOff ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            PAGADA
                        </span>
                    ) : (
                        <div className="text-right">
                            <p className="text-xs text-white/40 mb-0.5">Mínimo</p>
                            <p className="font-mono font-bold text-red-400">${Number(debt.min_payment).toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/40">Progreso</span>
                        <span className="text-white font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${isPaidOff ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                        />
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs text-white/40 mb-1">Restante</p>
                        <p className="text-2xl font-black text-white tracking-tight">
                            ${Number(debt.current_balance).toLocaleString()}
                        </p>
                    </div>

                    {!isPaidOff && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                            <Calendar className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-xs font-medium text-white/60">
                                {debt.due_date ? new Date(debt.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'N/A'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default DebtCard;
