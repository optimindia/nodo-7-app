import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, subWeeks, subYears, min, max, startOfDay, endOfDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseSmartDate } from '../../utils/format';

const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#030712]/90 border border-white/10 p-4 rounded-xl backdrop-blur-md shadow-xl">
                <p className="text-white/60 text-xs mb-1 capitalize">{label}</p>
                <p className="text-cyan-400 font-bold text-lg">
                    {formatCurrency ? formatCurrency(payload[0].value) : `$${payload[0].value.toLocaleString()}`}
                </p>
            </div>
        );
    }
    return null;
};

const ChartSection = ({ transactions = [], formatCurrency }) => {
    const [timeRange, setTimeRange] = useState('1m'); // '1w', '1m', '3m', '6m', '1y', 'all'

    const chartData = useMemo(() => {
        if (!transactions.length) {
            return Array.from({ length: 7 }).map((_, i) => ({
                name: format(new Date(), 'd MMM', { locale: es }),
                value: 0
            }));
        }

        const sortedTx = [...transactions].sort((a, b) => parseSmartDate(a.date || a.created_at) - parseSmartDate(b.date || b.created_at));
        const now = new Date();
        const end = endOfDay(now);
        let start;

        // Determine start date based on range
        switch (timeRange) {
            case '1w':
                start = subWeeks(now, 1);
                break;
            case '1m':
                start = subMonths(now, 1);
                break;
            case '3m':
                start = subMonths(now, 3);
                break;
            case '6m':
                start = subMonths(now, 6);
                break;
            case '1y':
                start = subYears(now, 1);
                break;
            case 'all':
                start = startOfDay(parseSmartDate(sortedTx[0].date || sortedTx[0].created_at));
                break;
            default:
                start = subMonths(now, 1);
        }

        // Generate all days in interval
        const days = eachDayOfInterval({ start, end });

        // Calculate initial balance before the start date
        let currentBalance = sortedTx
            .filter(tx => parseSmartDate(tx.date || tx.created_at) < start)
            .reduce((acc, tx) => {
                const amount = Number(tx.amount);
                if (tx.type === 'deposit' || tx.type === 'yield') return acc + amount;
                if (tx.type === 'withdrawal' || tx.type === 'payment') return acc - amount;
                return acc;
            }, 0);

        return days.map(day => {
            // Find transactions for this day
            const dayTx = sortedTx.filter(tx => isSameDay(parseSmartDate(tx.date || tx.created_at), day));

            // Apply transactions to balance
            dayTx.forEach(tx => {
                const amount = Number(tx.amount);
                if (tx.type === 'deposit' || tx.type === 'yield') currentBalance += amount;
                if (tx.type === 'withdrawal' || tx.type === 'payment') currentBalance -= amount;
            });

            return {
                name: format(day, 'd MMM', { locale: es }),
                fullDate: day,
                value: currentBalance
            };
        });

    }, [transactions, timeRange]);

    const ranges = [
        { id: '1w', label: '1S' },
        { id: '1m', label: '1M' },
        { id: '3m', label: '3M' },
        { id: '6m', label: '6M' },
        { id: '1y', label: '1A' },
        { id: 'all', label: 'Todo' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-[500px] relative overflow-hidden group flex flex-col"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 relative z-10 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Rendimiento Histórico</h3>
                    <p className="text-white/40 text-xs">Evolución de tu balance en el tiempo</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar">
                    {ranges.map(range => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${timeRange === range.id ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
                        >
                            {timeRange === range.id && (
                                <motion.div
                                    layoutId="activeRange"
                                    className="absolute inset-0 bg-cyan-500/10 rounded-lg border border-cyan-500/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{range.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Glow Effect */}
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-[130px] rounded-full pointer-events-none opacity-60" />

            <div className="w-full flex-1 min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                                <stop offset="40%" stopColor="#22d3ee" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            tick={{ fill: 'rgba(255,255,255,0.4)' }}
                            dy={10}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            tick={{ fill: 'rgba(255,255,255,0.4)' }}
                        />
                        <Tooltip
                            content={<CustomTooltip formatCurrency={formatCurrency} />}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="url(#strokeGradient)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#22d3ee' }}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default ChartSection;
