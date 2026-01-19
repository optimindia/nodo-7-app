import React from 'react';
import { ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TopExpenses = ({ transactions, formatCurrency }) => {

    // Filter and Sort Expenses
    const topExpenses = React.useMemo(() => {
        return transactions
            .filter(tx => tx.type === 'withdrawal' || tx.type === 'payment')
            .sort((a, b) => Number(b.amount) - Number(a.amount))
            .slice(0, 5);
    }, [transactions]);

    if (topExpenses.length === 0) return null; // Don't show if empty

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5">
            <h3 className="text-lg font-bold text-white mb-6 pl-2 border-l-4 border-rose-500">
                Mayores Gastos
                <span className="text-white/40 text-xs font-normal ml-2">(Top 5 del periodo)</span>
            </h3>

            <div className="space-y-4">
                {topExpenses.map((tx, index) => (
                    <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                <ArrowDownRight className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm truncate max-w-[150px] md:max-w-[200px]">
                                    {tx.description || tx.category || 'Gasto'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/40">{tx.category}</span>
                                    <span className="text-white/20 text-[10px]">•</span>
                                    <span className="text-xs text-white/40">{new Date(tx.date || tx.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-rose-400 font-bold font-mono">
                                -{formatCurrency(Number(tx.amount))}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default TopExpenses;
