import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const MonthlySummary = ({ transactions, formatCurrency }) => {
    const summaryData = useMemo(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const currentMonthTx = transactions.filter(tx =>
            isWithinInterval(new Date(tx.created_at), { start, end })
        );

        const income = currentMonthTx
            .filter(tx => tx.type === 'deposit' || tx.type === 'yield')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        const expenses = currentMonthTx
            .filter(tx => tx.type === 'withdrawal' || tx.type === 'payment')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        return [
            { name: 'Ingresos', value: income, color: '#22d3ee' }, // cyan-400
            { name: 'Gastos', value: expenses, color: '#f472b6' }  // pink-400
        ];
    }, [transactions]);

    const totalIncome = summaryData[0].value;
    const totalExpense = summaryData[1].value;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#030712]/90 border border-white/10 p-3 rounded-lg backdrop-blur-md text-xs">
                    <p className="text-white mb-1 opacity-60">{payload[0].payload.name}</p>
                    <p className="text-white font-bold text-lg">
                        {formatCurrency ? formatCurrency(payload[0].value) : payload[0].value}
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
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-[450px] flex flex-col relative overflow-hidden"
        >
            {/* Header */}
            <div className="mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white">Resumen Mensual</h3>
                <p className="text-white/40 text-xs">Ingresos vs Gastos este mes</p>
            </div>

            {/* Savings Rate Indicator */}
            <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between relative z-10">
                <div>
                    <div className="text-xs text-white/40 mb-1">Tasa de Ahorro</div>
                    <div className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-emerald-400' : 'text-pink-400'}`}>
                        {savingsRate.toFixed(1)}%
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${savingsRate >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-pink-500/10 text-pink-400'}`}>
                    {savingsRate >= 0 ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData} barSize={60}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                            {summaryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Background Ambience */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default MonthlySummary;
