import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';


const StatsCard = ({ title, value, trend, trendValue, icon: Icon, delay = 0, inverseTrend = false, comparisonLabel, variant = 'default' }) => {
    // If inverseTrend is true (e.g. Expenses), UP is Bad (pink), DOWN is Good (cyan)
    // If standard (Income), UP is Good (cyan), DOWN is Bad (pink)
    const isGood = inverseTrend ? trend === 'down' : trend === 'up';

    // Base Colors
    const defaultColorClass = isGood ? 'text-cyan-400' : 'text-pink-500';
    const defaultBgClass = isGood ? 'bg-cyan-500/10' : 'bg-pink-500/10';

    // Hero Variant Logic
    const isHero = variant === 'hero';

    // Smart Font Scaling Logic
    const getHeroFontSize = (val) => {
        const length = val ? val.toString().length : 0;
        if (length < 10) return 'text-4xl sm:text-5xl'; // $ 1.000
        if (length < 13) return 'text-3xl sm:text-4xl'; // $ 100.000,00
        if (length < 16) return 'text-2xl sm:text-3xl'; // $ 1.000.000,00
        return 'text-xl sm:text-2xl'; // Huge numbers
    };

    const heroFontSize = isHero ? getHeroFontSize(value) : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: isHero ? -2 : -5 }}
            className={`relative group overflow-hidden backdrop-blur-xl transition-all duration-300 border flex flex-col h-full
                ${isHero
                    ? 'justify-center p-5 sm:p-6 rounded-[1.5rem] bg-gradient-to-br from-[#0F172A] via-[#083344] to-[#0B1121] border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)] hover:border-cyan-400/50'
                    : 'justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 border-white/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:border-cyan-500/30'
                }
            `}
        >
            {/* Hero Specific Background Effects */}
            {isHero && (
                <>
                    {/* Animated Aurora Effect */}
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent rotate-45 animate-pulse-slow pointer-events-none opacity-50" />

                    {/* Floating Blobs */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-[60px] animate-blob" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] animate-blob animation-delay-2000" />

                    {/* Noise texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none" />
                </>
            )}

            {/* Standard Hover Gradient */}
            {!isHero && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            <div className="relative z-10 flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2 z-10 relative">
                    <h3 className={`${isHero ? 'text-cyan-200/80 mb-1 font-semibold text-xs sm:text-sm uppercase tracking-wider' : 'text-white/40 text-xs sm:text-sm font-medium mb-1'}`}>
                        {title}
                    </h3>

                    {/* Smart Responsive Amount */}
                    <div className={`font-bold tracking-tight text-white leading-none whitespace-nowrap transition-all duration-300 ${isHero ? `${heroFontSize} drop-shadow-lg` : 'text-xl sm:text-2xl'}`}>
                        {value}
                    </div>
                </div>

                {/* Icon Container */}
                <div className={`shrink-0 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isHero
                        ? 'absolute -top-2 -right-2 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-50 blur-[1px] rotate-12 z-0 pointer-events-none'
                        : `w-10 h-10 bg-white/5 border border-white/5 ${defaultColorClass} relative z-10`
                    }
                `}>
                    <Icon className={`${isHero ? 'w-10 h-10 text-cyan-300' : 'w-5 h-5'}`} />
                </div>
            </div>

            {/* Only show comparison for non-hero cards */}
            {!isHero && (
                <div className="relative z-10 flex items-center gap-2 mt-auto pt-2">
                    <span className={`flex items-center text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full 
                        ${defaultBgClass} ${defaultColorClass}
                    `}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {trendValue}
                    </span>
                    <span className="text-white/30 text-[10px]">
                        {comparisonLabel || 'vs periodo anterior'}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default StatsCard;
