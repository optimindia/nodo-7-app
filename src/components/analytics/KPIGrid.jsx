import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet, PiggyBank } from 'lucide-react';

const KPIGrid = ({ formatCurrency, kpis }) => {

    const cards = [
        {
            title: "Patrimonio Neto",
            value: kpis.netWorth,
            icon: Wallet,
            color: "cyan",
            subtext: "Activos Totales",
            trend: null
        },
        {
            title: kpis.netCashFlow >= 0 ? "Beneficio Neto" : "Pérdida Neta",
            value: kpis.netCashFlow,
            icon: kpis.netCashFlow >= 0 ? TrendingUp : TrendingDown,
            color: kpis.netCashFlow >= 0 ? "emerald" : "rose",
            subtext: kpis.netCashFlow >= 0 ? "Ganancia del periodo" : "Déficit del periodo",
            trend: null,
            isHighlight: true // Flag for special styling
        },
        {
            title: "Gasto Promedio Diario",
            value: kpis.dailyAverage,
            icon: DollarSign,
            color: "orange",
            subtext: "En este periodo",
            trend: null
        },
        {
            title: "Tasa de Ahorro",
            value: `${kpis.savingsRate}%`,
            icon: PiggyBank,
            color: kpis.savingsRate > 20 ? "purple" : kpis.savingsRate > 0 ? "blue" : "rose",
            subtext: "% de Ingresos retenidos",
            progress: kpis.savingsRate
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent overflow-hidden group hover:border-white/10 transition-colors`}
                >
                    {/* Background Glow */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-500/10 blur-[60px] rounded-full -translate-y-10 translate-x-10`} />

                    <div className="flex justify-between items-start relative z-10 mb-4">
                        <div>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</p>
                            <h3 className="text-2xl font-bold text-white tracking-tight">
                                {typeof card.value === 'number' ? formatCurrency(card.value) : card.value}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-2xl bg-${card.color}-500/10 text-${card.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                            {React.createElement(card.icon, { className: "w-6 h-6" })}
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                        <p className="text-xs text-white/30 flex items-center gap-1">
                            {card.subtext}
                        </p>
                    </div>

                    {/* Progress Bar for Savings Rate */}
                    {card.progress !== undefined && (
                        <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, Math.min(100, card.progress))}%` }}
                                className={`h-full bg-${card.color}-500`}
                            />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default KPIGrid;
