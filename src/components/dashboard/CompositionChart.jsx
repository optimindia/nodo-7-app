import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CompositionChart = ({ transactions, formatCurrency }) => {
    const data = useMemo(() => {
        const deposits = transactions
            .filter(tx => tx.type === 'deposit')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        const yields = transactions
            .filter(tx => tx.type === 'yield')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        // Only show if there's data
        if (deposits === 0 && yields === 0) return [];

        return [
            { name: 'Depósitos', value: deposits, color: '#3b82f6' }, // Blue
            { name: 'Rendimientos', value: yields, color: '#22d3ee' }, // Cyan
        ];
    }, [transactions]);

    const total = data.reduce((acc, item) => acc + item.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const percent = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="bg-[#030712]/90 border border-white/10 p-3 rounded-lg backdrop-blur-md text-xs shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                        <p className="text-white font-bold">{payload[0].name}</p>
                    </div>
                    <p className="text-white/80">
                        {formatCurrency ? formatCurrency(payload[0].value) : payload[0].value}
                        <span className="text-white/40 ml-2">({percent}%)</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-[400px] flex flex-col relative overflow-hidden"
        >
            <div className="mb-2 relative z-10">
                <h3 className="text-lg font-bold text-white">Fuentes de Ingreso</h3>
                <p className="text-white/40 text-xs">Composición de tu capital</p>
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
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-white/40 uppercase tracking-widest">Total</span>
                            <span className="text-lg font-bold text-white">
                                {formatCurrency ? formatCurrency(total) : total}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-white/20 text-sm">Sin datos suficientes</div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-col gap-2 relative z-10">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-white/60">{item.name}</span>
                        </div>
                        <span className="text-white font-medium">
                            {((item.value / total) * 100).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>

            {/* Background Ambience */}
            <div className="absolute bottom-0 right-0 w-[150px] h-[150px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default CompositionChart;
