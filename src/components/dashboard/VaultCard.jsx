import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock, TrendingUp, Shield, Sparkles, ArrowRight } from 'lucide-react';

const VaultCard = ({ title, apy, locked, minLock, color = "cyan" }) => {
    // 3D Tilt Effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const gradients = {
        cyan: "from-cyan-500 to-blue-600",
        purple: "from-purple-500 to-pink-600",
        emerald: "from-emerald-500 to-green-600",
        gold: "from-amber-400 to-orange-600"
    };

    const glowColor = {
        cyan: "group-hover:shadow-cyan-500/20",
        purple: "group-hover:shadow-purple-500/20",
        emerald: "group-hover:shadow-emerald-500/20",
        gold: "group-hover:shadow-amber-500/20"
    };

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative h-[400px] w-full rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-xl group cursor-pointer transition-shadow duration-500 shadow-xl ${glowColor[color]}`}
        >
            {/* Inner Content with Z-Depth */}
            <div
                style={{ transform: "translateZ(75px)" }}
                className="absolute inset-4 rounded-[2rem] bg-white/5 border border-white/5 p-6 flex flex-col justify-between overflow-hidden"
            >
                {/* Header */}
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg`}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {minLock}
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
                    <p className="text-white/40 text-sm">Bóveda de alto rendimiento</p>
                </div>

                {/* Main Stats */}
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-white/40 mb-1">APY (Anual)</p>
                        <div className={`text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${gradients[color]}`}>
                            {apy}%
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div>
                            <p className="text-xs text-white/40">Total Bloqueado</p>
                            <p className="text-white font-bold">{locked}</p>
                        </div>
                        <div className="ml-auto">
                            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group/btn">
                                <ArrowRight className="w-5 h-5 text-white group-hover/btn:-rotate-45 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Animated Background Blob */}
                <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradients[color]} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />
            </div>

            {/* Glass Reflection */}
            <div
                className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ transform: "translateZ(50px)" }}
            />
        </motion.div>
    );
};

export default VaultCard;
