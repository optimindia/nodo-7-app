import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Star, Shield, Zap, CheckCircle2 } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Bienvenido a la Revolución",
        description: "Descubre una nueva forma de gestionar tu vida digital con nuestra plataforma de última generación.",
        icon: Star,
        color: "from-primary to-purple-600"
    },
    {
        id: 2,
        title: "Seguridad Impenetrable",
        description: "Tus datos están protegidos con encriptación de grado militar. Tu privacidad es nuestra prioridad absoluta.",
        icon: Shield,
        color: "from-secondary to-pink-600"
    },
    {
        id: 3,
        title: "Velocidad de la Luz",
        description: "Experimenta un rendimiento sin precedentes. Todo lo que necesitas, al instante.",
        icon: Zap,
        color: "from-accent to-cyan-600"
    },
    {
        id: 4,
        title: "Todo Listo",
        description: "Has completado la configuración inicial. Es hora de comenzar tu viaje.",
        icon: CheckCircle2,
        color: "from-green-500 to-emerald-600"
    }
];

const Onboarding = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            if (onComplete) onComplete();
        }
    };

    const stepData = steps[currentStep];
    const Icon = stepData.icon;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stepData.color} opacity-10 transition-opacity duration-700`} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 blur-[150px] rounded-full animate-blob pointer-events-none" />

            <div className="w-full max-w-lg relative z-10">

                {/* Progress Indicators */}
                <div className="flex items-center justify-between mb-12 px-4">
                    {steps.map((_, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <div
                                className={`w-3 h-3 rounded-full transition-all duration-500 ${index <= currentStep
                                        ? `bg-cyan-400 shadow-[0_0_15px_#22d3ee] scale-125`
                                        : 'bg-white/10'
                                    }`}
                            />
                        </div>
                    ))}
                </div>

                {/* Content Card */}
                <div className="relative min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50, rotateY: 10 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, x: -50, rotateY: -10 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="glass-panel p-10 rounded-[2rem] border border-white/10 relative overflow-hidden group perspective-1000"
                        >
                            {/* Inner Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${stepData.color} opacity-20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2`} />

                            {/* Icon Bubble */}
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${stepData.color} p-[2px] mb-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] mx-auto`}
                            >
                                <div className="w-full h-full bg-[#030712] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stepData.color} opacity-20`} />
                                    <Icon className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] relative z-10" />
                                </div>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 mb-6 text-center tracking-tighter"
                            >
                                {stepData.title}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-cyan-100/60 text-lg text-center leading-relaxed font-light"
                            >
                                {stepData.description}
                            </motion.p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Button */}
                <motion.button
                    layout
                    onClick={handleNext}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,211,238,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full mt-8 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl text-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.2)] relative overflow-hidden group"
                >
                    <span className="relative z-10">{currentStep === steps.length - 1 ? 'Iniciar Viaje' : 'Siguiente'}</span>
                    <ChevronRight className="w-6 h-6 relative z-10" />

                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>

                {/* Skip button */}
                {currentStep < steps.length - 1 && (
                    <button
                        onClick={onComplete}
                        className="w-full mt-6 text-sm text-cyan-400/60 hover:text-cyan-400 transition-colors uppercase tracking-widest text-[10px] font-bold"
                    >
                        Saltar Introducción
                    </button>
                )}

            </div>
        </div>
    );
};

export default Onboarding;
