import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Wallet, PieChart as PieIcon,
    ArrowUpRight, ArrowDownRight, DollarSign, Activity
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

const Analytics = () => {
    const { transactions, formatCurrency, stats, loading } = useDashboardData();
    const { user } = useAuth();
    const [wallets, setWallets] = useState([]);

    // Fetch Wallets for Allocation Chart
    useEffect(() => {
        if (user) {
            supabase.from('wallets').select('*').eq('user_id', user.id)
                .then(({ data }) => {
                    if (data) setWallets(data);
                });
        }
    }, [user]);

    // --- DATA PROCESSING ---

    // 1. Monthly Cash Flow (Bar Chart)
    const monthlyFlowData = useMemo(() => {
        if (!transactions.length) return [];

        const last6Months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date()
        });

        return last6Months.map(month => {
            const monthTx = transactions.filter(tx => isSameMonth(new Date(tx.created_at), month));

            const income = monthTx
                .filter(tx => tx.type === 'deposit' || tx.type === 'yield')
                .reduce((acc, tx) => acc + Number(tx.amount), 0);

            const expense = monthTx
                .filter(tx => tx.type === 'withdrawal' || tx.type === 'payment')
                .reduce((acc, tx) => acc + Number(tx.amount), 0);

            return {
                name: format(month, 'MMM', { locale: es }),
                ingresos: income,
                gastos: expense,
            };
        });
    }, [transactions]);

    // 2. Asset Allocation (Pie Chart)
    const allocationData = useMemo(() => {
        if (!wallets.length) return [];

        const walletBalances = wallets.map(wallet => {
            const walletTx = transactions.filter(tx => tx.wallet_id === wallet.id);
            const balance = walletTx.reduce((acc, tx) => {
                if (tx.type === 'deposit' || tx.type === 'yield') return acc + Number(tx.amount);
                if (tx.type === 'withdrawal' || tx.type === 'payment') return acc - Number(tx.amount);
                return acc;
            }, 0);
            return { name: wallet.name, value: balance > 0 ? balance : 0 };
        }).filter(w => w.value > 0);

        return walletBalances;
    }, [wallets, transactions]);

    // 3. KPIs Calculation (Last 30 Days)
    const kpis = useMemo(() => {
        const now = new Date();
        const startLastMonth = subMonths(now, 1);

        const recentTx = transactions.filter(tx => new Date(tx.created_at) >= startLastMonth);

        const income = recentTx
            .filter(tx => tx.type === 'deposit' || tx.type === 'yield')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        const expense = recentTx
            .filter(tx => tx.type === 'withdrawal' || tx.type === 'payment')
            .reduce((acc, tx) => acc + Number(tx.amount), 0);

        const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

        return {
            income,
            expense,
            savingsRate: savingsRate.toFixed(1)
        };
    }, [transactions]);


    // --- RENDER HELPERS ---

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#030712] border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-white/60 text-xs mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Analíticas Financieras</h1>
                <p className="text-white/40">Visión profunda de tu salud financiera</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowUpRight className="w-12 h-12 text-green-400" /></div>
                    <p className="text-white/60 text-sm font-medium mb-1">Ingresos (30d)</p>
                    <h3 className="text-3xl font-bold text-white">{formatCurrency(kpis.income)}</h3>
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Flujo de entrada
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowDownRight className="w-12 h-12 text-pink-400" /></div>
                    <p className="text-white/60 text-sm font-medium mb-1">Gastos (30d)</p>
                    <h3 className="text-3xl font-bold text-white">{formatCurrency(kpis.expense)}</h3>
                    <div className="mt-2 text-xs text-pink-400 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Salidas recientes
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-12 h-12 text-cyan-400" /></div>
                    <p className="text-white/60 text-sm font-medium mb-1">Tasa de Ahorro</p>
                    <h3 className="text-3xl font-bold text-white">{kpis.savingsRate}%</h3>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, kpis.savingsRate))}%` }} />
                    </div>
                </motion.div>
            </div>

            {/* Charts Row 1: Cash Flow & Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Cash Flow Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-white/10 bg-white/5"
                >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-cyan-400" />
                        Flujo de Caja Mensual
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyFlowData} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `$${val / 1000}k`} />
                                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="gastos" name="Gastos" fill="#f472b6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Asset Allocation Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col"
                >
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-purple-400" />
                        Distribución
                    </h3>
                    <p className="text-white/40 text-sm mb-6">Por billetera</p>

                    <div className="flex-1 min-h-[250px] relative">
                        {allocationData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                Sin datos suficientes
                            </div>
                        )}

                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-white/20 text-xs uppercase font-bold tracking-wider">Total</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
