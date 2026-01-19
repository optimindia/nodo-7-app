import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isSameDay, isSameMonth, eachDayOfInterval, eachMonthOfInterval, parseISO, isValid, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { DATE_RANGES, getDateRangeInterval } from './AnalyticsHelpers';

const IncomeVsExpenseChart = ({ transactions, currentRange, formatCurrency }) => {

    const data = useMemo(() => {
        if (!transactions) return [];

        try {
            const { start, end } = getDateRangeInterval(currentRange);

            // Validate interval
            if (!isValid(start) || !isValid(end)) {
                console.error("Invalid Date Range:", { start, end, currentRange });
                return [];
            }

            let groupedData = [];

            // Helper to get safe date from transaction
            const getTxDate = (tx) => {
                const rawDate = tx.date || tx.created_at;
                if (!rawDate) return null;
                // tx.date is usually YYYY-MM-DD. parseISO handles it well.
                const date = parseISO(rawDate);
                // Adjust for timezone offset possibility if simple string? 
                // Actually parseISO('2024-01-01') is usually local time in older browsers, or UTC in modern.
                // Let's force it to be treated as a local date for comparison if it's YYYY-MM-DD
                if (extractDatePart(rawDate)) {
                    // It's just a date string, let's treat it as local start of day
                    const [y, m, d] = rawDate.split('-').map(Number);
                    return new Date(y, m - 1, d);
                }
                return date;
            };

            const extractDatePart = (dateString) => {
                if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) return true;
                return false;
            }

            const safeTransactions = transactions.map(tx => ({
                ...tx,
                parsedDate: getTxDate(tx)
            })).filter(tx => isValid(tx.parsedDate));

            // Determine grouping granularity based on range
            if (currentRange === DATE_RANGES.TODAY || currentRange === DATE_RANGES.WEEK || currentRange === DATE_RANGES.MONTH || currentRange === DATE_RANGES.LAST_3_MONTHS) {
                // Daily granularity
                const days = eachDayOfInterval({ start, end });
                groupedData = days.map(day => {
                    const dayTx = safeTransactions.filter(tx => isSameDay(tx.parsedDate, day));
                    return {
                        name: format(day, currentRange === DATE_RANGES.TODAY ? 'HH:00' : 'd MMM', { locale: es }), // For today maybe hours? fallback to days for now
                        fullDate: day, // For sorting if needed
                        ingresos: dayTx.filter(t => t.type === 'deposit' || t.type === 'yield').reduce((acc, t) => acc + Number(t.amount), 0),
                        gastos: dayTx.filter(t => t.type === 'withdrawal' || t.type === 'payment').reduce((acc, t) => acc + Number(t.amount), 0)
                    };
                });
            } else {
                // Monthly for Year/All
                const months = eachMonthOfInterval({ start, end });
                groupedData = months.map(month => {
                    const monthTx = safeTransactions.filter(tx => isSameMonth(tx.parsedDate, month));
                    return {
                        name: format(month, 'MMM yyyy', { locale: es }),
                        ingresos: monthTx.filter(t => t.type === 'deposit' || t.type === 'yield').reduce((acc, t) => acc + Number(t.amount), 0),
                        gastos: monthTx.filter(t => t.type === 'withdrawal' || t.type === 'payment').reduce((acc, t) => acc + Number(t.amount), 0)
                    };
                });
            }
            return groupedData;
        } catch (error) {
            console.error("Chart Data Error:", error);
            return [];
        }
    }, [transactions, currentRange]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0f172a] border border-white/10 p-4 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-white/60 text-xs mb-2 font-bold uppercase">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <p className="text-sm text-white">
                                <span className="opacity-70">{entry.name}: </span>
                                <span className="font-bold font-mono">{formatCurrency(entry.value)}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6 pl-2 border-l-4 border-cyan-500">Tendencia de Ingresos vs Gastos</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="ingresos"
                            name="Ingresos"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                        />
                        <Area
                            type="monotone"
                            dataKey="gastos"
                            name="Gastos"
                            stroke="#f43f5e"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default IncomeVsExpenseChart;
