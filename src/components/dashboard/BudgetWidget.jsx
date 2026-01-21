import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, AlertTriangle, ArrowRight } from 'lucide-react';
import { useBudgets } from '../../hooks/useBudgets';

const BudgetWidget = ({ transactions, formatCurrency, onViewChange }) => {
    const { budgetsWithProgress } = useBudgets(transactions);

    // Sort by highest percentage used
    const sortedBudgets = [...budgetsWithProgress].sort((a, b) => b.progress - a.progress);
    const topBudgets = sortedBudgets.slice(0, 3);
    const hasBudgets = budgetsWithProgress.length > 0;

    // Don't render anything if no budgets exist to avoid clutter
    if (!hasBudgets) return null;

    const handleNavigate = () => {
        if (onViewChange) onViewChange('budgets');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-400" />
                    Estado de Presupuestos
                </h3>
                <button
                    onClick={handleNavigate}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                    Ver Todos <ArrowRight size={14} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topBudgets.map(budget => {
                    let color = 'emerald';
                    if (budget.progress > 50) color = 'yellow';
                    if (budget.progress > 85) color = 'red';

                    return (
                        <motion.div
                            key={budget.id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#1a2235]/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                            onClick={handleNavigate}
                        >
                            {/* Status Glow */}
                            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`} />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white/90 truncate">{budget.category}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${color === 'red' ? 'bg-red-500/20 text-red-400' :
                                        color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {Math.round(budget.progress)}%
                                    </span>
                                </div>

                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <div className="text-xl font-bold text-white leading-none">
                                            {formatCurrency(budget.spent)}
                                        </div>
                                        <div className="text-[10px] text-white/40 font-medium uppercase mt-1">
                                            de {formatCurrency(budget.amount)}
                                        </div>
                                    </div>
                                    {color === 'red' && <AlertTriangle size={20} className="text-red-500 animate-pulse" />}
                                </div>

                                {/* Mini Progress Bar */}
                                <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${budget.progress}%` }}
                                        className={`h-full rounded-full bg-gradient-to-r from-${color}-600 to-${color}-400`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default BudgetWidget;
