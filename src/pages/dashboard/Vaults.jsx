import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VaultCard from '../../components/dashboard/VaultCard';
import { Sparkles, Coins, TrendingUp } from 'lucide-react';

const Vaults = () => {
    // Mock Data (Replace with real data later)
    const vaults = [
        {
            id: 1,
            title: "Stable Save",
            apy: "12.5",
            locked: "$240,492",
            minLock: "Flexible",
            color: "cyan"
        },
        {
            id: 2,
            title: "Crypto Growth",
            apy: "45.2",
            locked: "$85,201",
            minLock: "30 Días",
            color: "purple"
        },
        {
            id: 3,
            title: "Elite Staking",
            apy: "82.1",
            locked: "$1,290,200",
            minLock: "90 Días",
            color: "gold"
        }
    ];

    const stats = [
        { title: "Valor Total Bloqueado", value: "$1,615,893", icon: Coins, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        { title: "Rendimiento Generado", value: "$42,390", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { title: "Bóvedas Activas", value: "3", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" }
    ];

    return (
        <div className="space-y-12">
            {/* Header / Hero */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 p-8 sm:p-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-cyan-300 mb-4"
                    >
                        <Sparkles className="w-3 h-3" />
                        NUEVO SISTEMA DE STAKING
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight"
                    >
                        Maximiza tus <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Activos Digitales</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-white/60 mb-8"
                    >
                        Accede a bóvedas de alto rendimiento con seguridad institucional.
                        Tus fondos trabajan para ti mientras duermes.
                    </motion.p>

                    {/* Mini Stats in Hero */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="glass-panel p-4 rounded-xl border border-white/10 bg-black/20"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    </div>
                                    <span className="text-xs text-white/40 font-bold uppercase">{stat.title}</span>
                                </div>
                                <div className="text-xl font-bold text-white">{stat.value}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Vaults Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {vaults.map((vault, i) => (
                    <motion.div
                        key={vault.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                    >
                        <VaultCard {...vault} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Vaults;
