import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const BudgetCard = ({ budget, onDelete }) => {
    // Determine Color State
    let color = 'emerald'; // Safe
    if (budget.progress > 50) color = 'yellow'; // Warning
    if (budget.progress > 85) color = 'red'; // Danger

    const percentage = Math.round((budget.spent / budget.amount) * 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#1a2235]/60 backdrop-blur-md border border-white/5 rounded-3xl p-5 relative group overflow-hidden"
        >
            {/* Background Glow based on status */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl`} />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-0.5">{budget.category}</h3>
                        <div className="text-xs text-white/40 font-medium">Límite mensual</div>
                    </div>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(budget.id)}
                            className="p-2 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Amounts */}
                <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-black text-white">
                        {formatCurrency(budget.spent)}
                    </span>
                    <span className="text-sm font-medium text-white/40 mb-1">
                        de {formatCurrency(budget.amount)}
                    </span>
                </div>

                {/* Progress Bar Container */}
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${budget.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-${color}-500 to-${color}-400 shadow-[0_0_10px_rgba(0,0,0,0.5)_inset]`}
                    />
                </div>

                {/* Footer Status */}
                <div className="flex justify-between items-center mt-3">
                    <div className={`text-xs font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 
                        ${color === 'red' ? 'bg-red-500/10 text-red-400' :
                            color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-emerald-500/10 text-emerald-400'}`
                    }>
                        {color === 'red' && <AlertTriangle size={12} />}
                        {color === 'emerald' && <CheckCircle size={12} />}
                        {percentage}% Gastado
                    </div>

                    {budget.isOverBudget && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                            ¡Excedido!
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default BudgetCard;
