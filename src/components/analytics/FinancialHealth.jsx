import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, AlertTriangle, TrendingUp, HeartPulse, Scale, Hourglass } from 'lucide-react';

const FinancialHealth = ({ kpis }) => {

    // Safety check for empty data
    if (!kpis) return null;

    const rate = parseFloat(kpis.savingsRate) || 0;
    const cashFlow = kpis.netCashFlow || 0;
    const netWorth = kpis.netWorth || 0;
    const dailyExpenses = kpis.dailyAverage || 0;
    const monthlyExpenses = dailyExpenses * 30;

    // --- SCORING ALGORITHM V2 (Granular) ---

    // 1. CAPACITY (Savings Rate) - Max 40 pts
    // Logarithmic curve: Harder to get points as you go higher, rewards starting to save.
    // 0% -> 0 pts
    // 10% -> 20 pts
    // 20% -> 30 pts
    // 40% -> 40 pts
    let capacityScore = 0;
    if (rate > 0) {
        capacityScore = Math.min(40, (rate * 1.5)); // Linear approx for simplicity, capped at 40 (reached at ~26% savings)
        if (rate > 30) capacityScore = 40; // Cap
    }

    // 2. SOLIDITY (Runway / Emergency Fund) - Max 30 pts
    // How many months can you survive?
    // Target: 6 months = Max Score.
    let runwayMonths = 0;
    let solidityScore = 0;

    if (monthlyExpenses > 0) {
        runwayMonths = netWorth / monthlyExpenses;
        solidityScore = Math.min(30, (runwayMonths / 6) * 30); // 5 pts per month of runway
        if (solidityScore < 0) solidityScore = 0;
    } else if (netWorth > 0) {
        // Edge case: No expenses yet but has money -> Good start
        solidityScore = 15;
        runwayMonths = 99; // Infinite
    }

    // 3. STABILITY (Cash Flow positive) - Max 30 pts
    // Simple check: Did you earn more than you spent?
    let stabilityScore = 0;
    if (cashFlow > 0) stabilityScore = 30;
    else if (cashFlow === 0 && kpis.income > 0) stabilityScore = 15; // Break even
    else stabilityScore = 0;

    // TOTAL SCORE
    const totalScore = Math.min(100, Math.round(capacityScore + solidityScore + stabilityScore));


    // Determine Status
    let status = { label: 'Crítico', color: 'rose', icon: AlertTriangle, msg: 'Tus gastos superan tus ingresos. Prioriza reducir lo innecesario.' };

    if (totalScore >= 85) status = { label: 'Excelente', color: 'emerald', icon: ShieldCheck, msg: '¡Estás en gran forma! Estás construyendo riqueza sólida.' };
    else if (totalScore >= 65) status = { label: 'Saludable', color: 'cyan', icon: HeartPulse, msg: 'Vas bien. Tienes buenas bases, sigue aumentando tu fondo.' };
    else if (totalScore >= 40) status = { label: 'Estable', color: 'yellow', icon: TrendingUp, msg: 'Estás a flote, pero cualquier imprevisto podría afectarte.' };


    const getColorHex = (colorName) => {
        const colors = {
            emerald: '#10b981',
            cyan: '#06b6d4',
            yellow: '#fbbf24',
            rose: '#f43f5e'
        };
        return colors[colorName] || colors.emerald;
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 h-full flex flex-col justify-between relative overflow-hidden">
            {/* Decorative Background */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-${status.color}-500/10 blur-[80px] rounded-full transition-colors duration-500`} />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1 pl-2 border-l-4 border-blue-500">Salud Financiera</h3>
                    <p className="text-white/40 text-xs">Diagnóstico inteligente 2.0</p>
                </div>
                <div className={`px-3 py-1 rounded-full bg-${status.color}-500/20 text-${status.color}-400 text-xs font-bold border border-${status.color}-500/20`}>
                    {status.label}
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                {/* Score Circle */}
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                        <motion.circle
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: totalScore / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={getColorHex(status.color)}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray="1 1"
                            strokeLinecap="round"
                            className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center inset-0">
                        <span className="text-4xl font-black text-white tracking-tighter shadow-black drop-shadow-md">{totalScore}</span>
                        <span className="text-[10px] text-white/40 uppercase">Puntos</span>
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="flex-1 w-full space-y-4">

                    {/* Capacity */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ahorro</span>
                            <span className="text-white font-bold">{Math.min(100, rate).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${Math.min(100, (capacityScore / 40) * 100)}%` }}
                                className="h-full bg-purple-400 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Solidity */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Solidez (Runway)</span>
                            <span className="text-white font-bold">{runwayMonths > 12 ? '12+' : runwayMonths.toFixed(1)} m.</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${Math.min(100, (solidityScore / 30) * 100)}%` }}
                                className="h-full bg-cyan-400 rounded-full"
                            />
                        </div>
                        <p className="text-[9px] text-white/20 mt-0.5">Fondo para meses sin ingresos</p>
                    </div>

                    {/* Stability */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60 flex items-center gap-1"><Scale className="w-3 h-3" /> Estabilidad</span>
                            <span className={`font-bold ${stabilityScore > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stabilityScore > 0 ? 'Positiva' : 'Negativa'}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${(stabilityScore / 30) * 100}%` }}
                                className={`h-full rounded-full ${stabilityScore > 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FinancialHealth;
