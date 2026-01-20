import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Zap, Trophy, Shield, Skull, ArrowRight, CheckCircle2 } from 'lucide-react';

const SnowballStrategy = ({ debts, monthlyExtra, budgetTotal, onPayDebt }) => {

    const strategyData = useMemo(() => {
        try {
            if (!debts || debts.length === 0) return null;

            const toNum = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

            // 1. Filter & Sort (Smallest Balance First)
            let activeDebts = debts.filter(d => toNum(d.current_balance) > 0);
            activeDebts.sort((a, b) => toNum(a.current_balance) - toNum(b.current_balance));

            if (activeDebts.length === 0) return { isFree: true };

            // 2. Identify the Target (The Boss)
            const targetDebt = activeDebts[0];
            const otherDebts = activeDebts.slice(1);

            // 3. Calculate Payment Plan
            const targetMin = toNum(targetDebt.min_payment);
            // Power Payment = Minimum + Extra Budget
            const powerPayment = targetMin + monthlyExtra;
            // Cap at balance
            const actualPayment = Math.min(powerPayment, toNum(targetDebt.current_balance));

            return {
                isFree: false,
                target: targetDebt,
                others: otherDebts,
                paymentAmount: actualPayment,
                extraPower: monthlyExtra
            };

        } catch (e) {
            console.error("Strategy Calc Error", e);
            return null;
        }
    }, [debts, monthlyExtra]);


    if (!strategyData) return null;

    if (strategyData.isFree) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl">
            <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h3 className="text-3xl font-black text-white mb-2">¡MISIÓN CUMPLIDA!</h3>
            <p className="text-xl text-white/60">Has eliminado todas tus deudas.</p>
            <p className="text-sm text-white/40 mt-4">Eres libre.</p>
        </div>
    );

    return (
        <div className="space-y-6">

            {/* 1. THE BOSS FIGHT (Active Target) */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                {/* Background FX */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-wider mb-2">
                                <Skull className="w-4 h-4" /> Objetivo Actual
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-1">{strategyData.target.name}</h2>
                            <p className="text-white/60">Saldo restante: <span className="text-white font-bold">${Number(strategyData.target.current_balance).toLocaleString()}</span></p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-white/40 font-mono tracking-widest uppercase">ENEMIGO #1</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-sm text-white/60 mb-1">Tu Misión este mes:</p>
                            <p className="text-white text-lg">
                                Paga exactamente esta cantidad a <strong className="text-red-400">{strategyData.target.name}</strong>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <div className="bg-red-600 text-white px-8 py-4 rounded-xl font-black text-3xl shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2">
                                <Zap className="w-6 h-6 fill-current" />
                                ${strategyData.paymentAmount.toLocaleString()}
                            </div>
                            <button
                                onClick={() => onPayDebt && onPayDebt(strategyData.target)}
                                className="w-full py-3 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-gray-200 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 text-red-600" />
                                Pagar Ahora
                            </button>
                        </div>
                    </div>

                    {strategyData.extraPower > 0 ? (
                        <p className="text-xs text-center md:text-right mt-4 text-emerald-400/80 flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Incluye el mínimo + ${strategyData.extraPower.toLocaleString()} extra de tu presupuesto.
                        </p>
                    ) : (
                        <p className="text-xs text-center md:text-right mt-4 text-orange-400/80 flex items-center justify-end gap-1.5">
                            <Shield className="w-4 h-4" />
                            Solo cubriendo el mínimo. Aumenta tu presupuesto para atacar más fuerte.
                        </p>
                    )}
                </div>
            </div>

            {/* 2. MAINTENANCE MODE (Others) */}
            {strategyData.others.length > 0 && (
                <div className="p-6 rounded-3xl bg-[#1e293b] border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Modo Mantenimiento</h3>
                    </div>
                    <p className="text-sm text-white/60 mb-4">
                        Con estas deudas, solo paga el <strong>MÍNIMO</strong> para que no crezcan. No gastes ni un centavo más aquí. Todo el poder va al Objetivo Actual.
                    </p>

                    <div className="space-y-3">
                        {strategyData.others.map((debt) => (
                            <div key={debt.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 opacity-70 hover:opacity-100 transition-opacity group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                    <span className="font-medium text-white">{debt.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-white/40 mb-0.5">Pagar Mínimo</p>
                                        <p className="font-mono font-bold text-white">${Number(debt.min_payment).toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => onPayDebt && onPayDebt(debt)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        title="Registrar Pago"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SnowballStrategy;
