import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { subMonths, startOfMonth, endOfMonth, format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const ComparisonChart = ({ transactions, formatCurrency }) => {
    const data = useMemo(() => {
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            return {
                month: format(date, 'MMM', { locale: es }),
                fullDate: date,
                income: 0,
                expenses: 0
            };
        });

        transactions.forEach(tx => {
            const txDate = new Date(tx.created_at);
            const monthData = last6Months.find(m =>
                isWithinInterval(txDate, {
                    start: startOfMonth(m.fullDate),
                    end: endOfMonth(m.fullDate)
                })
            );

            if (monthData) {
                const amount = Number(tx.amount);
                if (tx.type === 'deposit' || tx.type === 'yield') {
                    monthData.income += amount;
                } else if (tx.type === 'withdrawal' || tx.type === 'payment') {
                    monthData.expenses += amount;
                }
            }
        });

        return last6Months;
    }, [transactions]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#030712]/90 border border-white/10 p-4 rounded-xl backdrop-blur-md shadow-xl text-xs">
                    <p className="text-white/60 mb-2 capitalize font-bold">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-white/80">{entry.name}:</span>
                            <span className="text-white font-bold ml-auto">
                                {formatCurrency ? formatCurrency(entry.value) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-[400px] flex flex-col relative overflow-hidden"
        >
            <div className="mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white">Ingresos vs Gastos</h3>
                <p className="text-white/40 text-xs">Comparativa de los últimos 6 meses</p>
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'capitalize' }}
                            dy={10}
                        />
                        <YAxis
                            hide
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-white/60 text-xs ml-1">{value}</span>}
                        />
                        <Bar
                            name="Ingresos"
                            dataKey="income"
                            fill="#22d3ee"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                        <Bar
                            name="Gastos"
                            dataKey="expenses"
                            fill="#f472b6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default ComparisonChart;
