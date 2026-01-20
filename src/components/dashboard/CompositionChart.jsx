import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const CompositionChart = ({ wallets = [], formatCurrency }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    const data = useMemo(() => {
        // Filter out wallets with 0 or negative balance for the chart to look good?
        // Usually better to show positive balances.
        return wallets
            .filter(w => Number(w.balance) > 0)
            .map(w => ({
                name: w.name,
                value: Number(w.balance),
                color: w.color || '#fff' // Fallback color
            }))
            .sort((a, b) => b.value - a.value); // Sort by value desc
    }, [wallets]);

    const total = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
    const activeItem = activeIndex !== null ? data[activeIndex] : null;

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-[400px] flex flex-col relative overflow-hidden"
        >
            <div className="mb-2 relative z-10">
                <h3 className="text-lg font-bold text-white">Distribución de Capital</h3>
                <p className="text-white/40 text-xs">Balance por billetera</p>
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10 flex items-center justify-center">
                {data.length > 0 ? (
                    <div className="w-full h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                    onMouseEnter={onPieEnter}
                                    onMouseLeave={onPieLeave}
                                    onClick={onPieEnter} // For mobile tap
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-300 outline-none"
                                            fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                            style={{
                                                filter: activeIndex === index ? `drop-shadow(0 0 10px ${entry.color}40)` : 'none',
                                                transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                                                transformOrigin: 'center'
                                            }}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Info - Smart Interaction */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8 text-center">
                            <AnimatePresence mode="wait">
                                {activeItem ? (
                                    <motion.div
                                        key="active"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex flex-col items-center"
                                    >
                                        <span className="text-xs font-bold text-white/60 mb-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/5" style={{ color: activeItem.color, borderColor: `${activeItem.color}20`, backgroundColor: `${activeItem.color}10` }}>
                                            {activeItem.name}
                                        </span>
                                        <span className="text-xl font-bold text-white tracking-tight">
                                            {formatCurrency ? formatCurrency(activeItem.value) : activeItem.value}
                                        </span>
                                        <span className="text-xs text-white/40 font-medium">
                                            {((activeItem.value / total) * 100).toFixed(1)}%
                                        </span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="total"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex flex-col items-center"
                                    >
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Total</span>
                                        <span className="text-2xl font-bold text-white tracking-tight">
                                            {formatCurrency ? formatCurrency(total) : total}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div className="text-white/20 text-sm flex flex-col items-center justify-center text-center gap-2">
                        <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-white/10 animate-pulse box-border" />
                        <span>Sin fondos aún</span>
                    </div>
                )}
            </div>

            {/* Legend - Scrollable if many wallets */}
            <div className="mt-4 flex flex-col gap-2 relative z-10 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                {data.map((item, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-between text-xs transition-opacity duration-200 ${activeIndex !== null && activeIndex !== i ? 'opacity-30' : 'opacity-100'}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-white/70 font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/40 tabular-nums">
                                {formatCurrency ? formatCurrency(item.value) : item.value}
                            </span>
                            <span className="text-white font-bold w-8 text-right">
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Background Ambience */}
            <div className="absolute bottom-0 right-0 w-[150px] h-[150px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default CompositionChart;
