import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#60a5fa'];

const CategoryBreakdown = ({ transactions, formatCurrency }) => {

    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        // Filter only expenses
        const expenses = transactions.filter(tx => tx.type === 'withdrawal' || tx.type === 'payment');

        // Group by Category
        const grouped = expenses.reduce((acc, tx) => {
            const cat = tx.category || 'Sin Categoría';
            acc[cat] = (acc[cat] || 0) + Number(tx.amount);
            return acc;
        }, {});

        // Convert to array and sort
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Descending order

    }, [transactions]);

    const totalExpense = data.reduce((acc, curr) => acc + curr.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const entry = payload[0];
            return (
                <div className="bg-[#0f172a] border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-white text-sm font-bold mb-1">{entry.name}</p>
                    <p className="text-white/60 text-xs">
                        {formatCurrency(entry.value)}
                        <span className="ml-2 opacity-50">({((entry.value / totalExpense) * 100).toFixed(1)}%)</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-2 pl-2 border-l-4 border-purple-500">Gastos por Categoría</h3>

            <div className="flex-1 flex flex-col md:flex-row items-center gap-6 min-h-0">
                {/* Chart */}
                <div className="w-full md:w-1/2 h-[250px] relative">
                    {data.length > 0 ? (
                        <>
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
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-white/20 text-xs font-bold uppercase">Total</span>
                                <span className="text-white font-bold text-sm tracking-tighter">{formatCurrency(totalExpense)}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/20 text-sm">
                            Sin gastos registrados
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="w-full md:w-1/2 h-full overflow-y-auto custom-scrollbar pr-2">
                    <div className="space-y-3">
                        {data.map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm text-white/80 truncate max-w-[100px] group-hover:text-white transition-colors">{entry.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white font-mono">{formatCurrency(entry.value)}</p>
                                    <p className="text-[10px] text-white/40">{((entry.value / totalExpense) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryBreakdown;
