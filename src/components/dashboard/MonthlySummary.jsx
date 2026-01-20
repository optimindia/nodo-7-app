import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';

const MonthlySummary = ({
    income = 0,
    expenses = 0,
    title = "Resumen del Periodo",
    subtitle = "Ingresos vs Gastos",
    formatCurrency
}) => {

    // Create data from props instead of calculating internally
    const summaryData = useMemo(() => {
        // Prevent empty chart by providing small values if both are 0 so it renders 'something' 
        // or just let it be 0.
        return [
            { name: 'Ingresos', value: Number(income), color: '#22d3ee' }, // cyan-400
            { name: 'Gastos', value: Number(expenses), color: '#f472b6' }  // pink-400
        ];
    }, [income, expenses]);

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const isPositive = savingsRate >= 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#030712]/90 border border-white/10 p-3 rounded-lg backdrop-blur-md text-xs shadow-xl">
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
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-white/40 text-xs">{subtitle}</p>
            </div>

            {/* Savings Rate Indicator */}
            <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between relative z-10">
                <div>
                    <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                        Tasa de Ahorro
                        <div className="group relative">
                            <Info className="w-3 h-3 cursor-help text-white/20 hover:text-white/60" />
                            <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-[10px] p-2 rounded-lg hidden group-hover:block border border-white/10 z-50">
                                Porcentaje de ingresos que no se gastaron.
                            </div>
                        </div>
                    </div>
                    <div className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-pink-400'}`}>
                        {savingsRate.toFixed(1)}%
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-pink-500/10 text-pink-400'}`}>
                    {isPositive ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
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
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} />
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
