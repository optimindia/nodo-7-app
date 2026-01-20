import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ title, value, trend, trendValue, icon: Icon, delay = 0, inverseTrend = false, comparisonLabel }) => {
    // If inverseTrend is true (e.g. Expenses), UP is Bad (pink), DOWN is Good (cyan)
    // If standard (Income), UP is Good (cyan), DOWN is Bad (pink)
    const isGood = inverseTrend ? trend === 'down' : trend === 'up';
    const colorClass = isGood ? 'text-cyan-400' : 'text-pink-500';
    const bgClass = isGood ? 'bg-cyan-500/10' : 'bg-pink-500/10';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="relative group p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:border-cyan-500/30"
        >
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-white/40 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2">
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${bgClass} ${colorClass}`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {trendValue}
                </span>
                <span className="text-white/30 text-xs">{comparisonLabel || 'vs periodo anterior'}</span>
            </div>
        </motion.div>
    );
};

export default StatsCard;
