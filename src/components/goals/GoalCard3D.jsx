import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Target, Calendar, Clock, TrendingUp, PlusCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { differenceInDays, differenceInHours, format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const GoalCard3D = ({ goal, onEdit, onQuickAdd }) => {
    // --- 3D TILT EFFECT V4 (Softened) ---
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Softened physics for "Premium" feel
    const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

    // Subtle rotation range (8deg)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
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

    // --- LOGIC ---
    const target = Number(goal.target_amount) || 1;
    const current = Number(goal.current_amount) || 0;
    const progressRaw = (current / target) * 100;
    const progress = Math.min(Math.max(progressRaw, 0), 100);

    let deadlineStatus = 'normal';
    let timeLeftText = 'Sin fecha';
    let statusColor = 'emerald';

    if (goal.deadline) {
        const now = new Date();
        const end = parseISO(goal.deadline);

        if (isValid(end)) {
            const daysLeft = differenceInDays(end, now);
            const hoursLeft = differenceInHours(end, now);

            if (daysLeft < 0) {
                deadlineStatus = 'expired';
                timeLeftText = 'Expirado';
                statusColor = 'gray';
            } else if (hoursLeft < 24) {
                deadlineStatus = 'critical';
                timeLeftText = `¡Menos de 24h!`;
                statusColor = 'rose';
            } else if (daysLeft <= 3) {
                deadlineStatus = 'warning';
                timeLeftText = `Solo ${daysLeft} días`;
                statusColor = 'yellow';
            } else {
                deadlineStatus = 'normal';
                timeLeftText = `Faltan ${daysLeft} días`;
                statusColor = 'emerald';
            }
        }
    }

    const isUrgent = deadlineStatus === 'critical' || deadlineStatus === 'warning';

    // --- COLOR MAPPING (Static Classes for Tailwind) ---
    const colorMap = {
        emerald: {
            text: 'text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-500',
            gradient: 'from-emerald-600 to-emerald-400',
            shadow: 'shadow-emerald-500/10',
            glow: 'bg-emerald-500/10',
            badgeBg: 'bg-black/40',
            badgeBorder: 'border-emerald-500/50'
        },
        yellow: {
            text: 'text-yellow-400',
            bg: 'bg-yellow-500',
            border: 'border-yellow-500',
            gradient: 'from-yellow-600 to-yellow-400',
            shadow: 'shadow-yellow-500/10',
            glow: 'bg-yellow-500/10',
            badgeBg: 'bg-black/40',
            badgeBorder: 'border-yellow-500/50'
        },
        rose: {
            text: 'text-rose-400',
            bg: 'bg-rose-500',
            border: 'border-rose-500',
            gradient: 'from-rose-600 to-rose-400',
            shadow: 'shadow-rose-500/10',
            glow: 'bg-rose-500/10',
            badgeBg: 'bg-black/40',
            badgeBorder: 'border-rose-500/50'
        },
        gray: {
            text: 'text-gray-400',
            bg: 'bg-gray-500',
            border: 'border-gray-500',
            gradient: 'from-gray-600 to-gray-400',
            shadow: 'shadow-gray-500/10',
            glow: 'bg-gray-500/10',
            badgeBg: 'bg-black/40',
            badgeBorder: 'border-gray-500/50'
        }
    };

    const colors = colorMap[statusColor] || colorMap.emerald;

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: "1200px" }}
            className="w-full h-[400px]"
        >
            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className={`relative w-full h-full rounded-[2.5rem] bg-[#0f172a] border border-white/10 cursor-pointer transition-shadow duration-300 hover:shadow-2xl ${colors.shadow} group`}
                onClick={() => onEdit(goal)}
            >
                {/* --- LAYERS --- */}

                {/* 1. BACKGROUND IMAGE */}
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
                    {goal.image_url ? (
                        <>
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={goal.image_url}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                                />
                            </div>
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-[#0f172a]/40" />
                        </>
                    ) : (
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                    )}
                </div>

                {/* 2. AMBIENT GLOW */}
                <div className={`absolute inset-0 z-20 ${colors.glow} blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* 3. CONTENT */}
                <div
                    style={{ transform: "translateZ(60px)" }}
                    className="absolute inset-0 z-30 p-8 flex flex-col justify-between"
                >
                    {/* Top Row */}
                    <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg`}>
                            <Target className={`w-6 h-6 ${colors.text}`} />
                        </div>

                        {/* Deadline Badge */}
                        {goal.deadline && (
                            <div className={`px-4 py-2 rounded-full ${colors.badgeBg} border border-white/10 backdrop-blur-md flex items-center gap-2 ${isUrgent ? 'animate-pulse border-opacity-100' : 'border-opacity-50'} ${colors.border}`}>
                                <Clock className={`w-4 h-4 ${colors.text}`} />
                                <span className={`${colors.text} text-xs font-bold uppercase`}>{timeLeftText}</span>
                            </div>
                        )}
                    </div>

                    {/* Title Section */}
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white leading-tight drop-shadow-lg line-clamp-2">{goal.title}</h3>
                        <p className="text-white/60 font-medium text-sm mt-1">
                            Meta: <span className="text-white">${target.toLocaleString()}</span>
                        </p>
                    </div>

                    <div className="flex-1" />

                    {/* Progress Section */}
                    <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1">Ahorrado</p>
                                <p className="text-4xl font-bold text-white tracking-tighter shadow-black drop-shadow-md">
                                    ${current.toLocaleString()}
                                </p>
                            </div>
                            <span className={`text-2xl font-bold ${colors.text}`}>{progress.toFixed(0)}%</span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-6 w-full bg-black/50 border border-white/10 rounded-full p-1 shadow-inner backdrop-blur-sm">
                            {/* The Bar Itself */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} shadow-[0_0_10px_rgba(0,0,0,0.5)] relative overflow-hidden`}
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 bg-white/20 -skew-x-12 w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* 4. QUICK ADD BUTTON */}
                <div
                    style={{ transform: "translateZ(80px)" }}
                    className="absolute bottom-32 right-6 z-40 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0"
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuickAdd(goal); }}
                        className={`p-4 rounded-full ${colors.bg} text-white shadow-xl hover:scale-110 active:scale-95 transition-transform border-4 border-[#0f172a]`}
                    >
                        <PlusCircle className="w-6 h-6" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default GoalCard3D;
