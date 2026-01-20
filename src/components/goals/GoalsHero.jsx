import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Rocket, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const GoalsHero = ({ goals }) => {
    const totalTarget = goals.reduce((acc, g) => acc + Number(g.target_amount), 0);
    const totalSaved = goals.reduce((acc, g) => acc + Number(g.current_amount), 0);
    const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    // Calculate "Distance to Dreams"
    const remaining = totalTarget - totalSaved;

    return (
        <div className="relative w-full p-8 md:p-12 rounded-[3rem] overflow-hidden border border-white/10 bg-[#0f172a] mb-12">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-300 text-sm font-bold mb-4"
                        >
                            <Rocket className="w-4 h-4" />
                            <span>Acelerador de Sueños</span>
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Tu libertad financiera <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">está al </span>
                            <span className="text-cyan-400">{totalProgress.toFixed(0)}%</span>
                        </h1>
                    </div>

                    <div className="flex gap-8">
                        <div>
                            <p className="text-white/40 text-sm uppercase font-bold tracking-wider mb-1">Ahorrado</p>
                            <p className="text-2xl font-bold text-white font-mono">{formatCurrency(totalSaved)}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                            <p className="text-white/40 text-sm uppercase font-bold tracking-wider mb-1">Falta para la meta</p>
                            <p className="text-2xl font-bold text-white/60 font-mono">{formatCurrency(remaining)}</p>
                        </div>
                    </div>
                </div>

                {/* Visualizer Right Side */}
                <div className="relative w-full md:w-1/3 h-[200px] flex items-center justify-center">
                    {/* Outer Ring */}
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <circle cx="50%" cy="50%" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="20" fill="none" />
                        <motion.circle
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: totalProgress / 100 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            cx="50%" cy="50%" r="80"
                            stroke="url(#gradient)"
                            strokeWidth="20"
                            fill="none"
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <Trophy className="w-10 h-10 text-yellow-400 mb-2 drop-shadow-lg animate-bounce" />
                        <span className="text-white font-bold text-sm">Nivel {Math.floor(totalSaved / 50000) + 1}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoalsHero;
