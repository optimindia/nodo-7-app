import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight, Wallet, Bot, PieChart, BarChart3, TrendingUp, Globe2, BrainCircuit } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Control Total",
        subtitle: "Billeteras • Cuentas • Efectivo",
        description: "Centraliza todas tus fuentes de dinero. Gestiona cuentas bancarias, billeteras cripto y efectivo en una sola vista unificada.",
        icon: Wallet,
        color: "from-cyan-400 to-blue-600",
        bgGradient: "from-cyan-500/10 to-transparent",
        features: ["Saldos Reales", "Gestión de Activos", "Historial Unificado"]
    },
    {
        id: 2,
        title: "Asistente IA Integrado",
        subtitle: "Chat • Consultas • Rapidez",
        description: "Interactúa con tus finanzas usando lenguaje natural. Pregunta por tu saldo, revisa tus metas o consulta gastos sin navegar por menús.",
        icon: Bot,
        color: "from-purple-400 to-pink-600",
        bgGradient: "from-purple-500/10 to-transparent",
        features: ["Chat Financiero", "Respuestas al Instante", "Siempre Disponible"]
    },
    {
        id: 3,
        title: "Analítica Visual",
        subtitle: "Gráficos • Tendencias • Claridad",
        description: "Entiende hacia dónde va tu dinero. Visualiza tus gastos por categorías y detecta patrones de consumo con gráficos intuitivos.",
        icon: BarChart3,
        color: "from-amber-400 to-orange-600",
        bgGradient: "from-amber-500/10 to-transparent",
        features: ["Desglose de Gastos", "Métricas Claras", "Filtrado por Fecha"]
    },
    {
        id: 4,
        title: "Presupuestos Inteligentes",
        subtitle: "Metas • Límites • Ahorro",
        description: "Establece límites de gasto mensuales y monitorea tu progreso en tiempo real para alcanzar tus objetivos financieros.",
        icon: PieChart,
        color: "from-emerald-400 to-green-600",
        bgGradient: "from-emerald-500/10 to-transparent",
        features: ["Control de Gastos", "Metas de Ahorro", "Progreso Visual"]
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
        <div className="relative w-full h-screen overflow-hidden bg-[#030712] flex items-center justify-center font-sans tracking-tight text-white selection:bg-cyan-500/30">
            {/* Background Ambience */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={stepData.id + '-bg'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className={`absolute inset-0 bg-gradient-radial ${stepData.bgGradient} opacity-30`}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

            {/* Main Content Card with 3D-ish feel */}
            <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center content-center h-full lg:h-auto">

                {/* Visuals (Top on Mobile, Left on Desktop) */}
                <div className="order-1 lg:order-1 relative flex justify-center lg:justify-end perspective-1000 mt-10 lg:mt-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: -20, rotateY: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, rotateY: 10, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="relative w-64 h-64 md:w-[400px] md:h-[400px]"
                        >
                            {/* Card Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stepData.color} blur-[60px] opacity-40 rounded-full animate-pulse`} />

                            {/* The Card/Icon Container */}
                            <div className="relative w-full h-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-6 overflow-hidden group">
                                {/* Decorational Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />

                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className={`w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br ${stepData.color} flex items-center justify-center shadow-lg shadow-black/50 mb-6 relative z-10`}
                                >
                                    <Icon className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-md" />
                                </motion.div>

                                {/* Feature Pills */}
                                <div className="flex flex-wrap gap-2 justify-center relative z-10">
                                    {stepData.features.map((feature, idx) => (
                                        <motion.span
                                            key={feature}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + (idx * 0.1) }}
                                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-medium text-white/90 whitespace-nowrap"
                                        >
                                            {feature}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Text & Actions (Bottom on Mobile, Right on Desktop) */}
                <div className="order-2 lg:order-2 flex flex-col justify-center text-center lg:text-left pt-4 lg:pt-0 pb-10 lg:pb-0">
                    {/* Steps Indicator */}
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? `w-12 bg-gradient-to-r ${stepData.color}` : 'w-2 bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep + '-text'}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className={`text-xs md:text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${stepData.color} mb-2 uppercase tracking-widest`}>
                                {stepData.subtitle}
                            </h2>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight text-white">
                                {stepData.title}
                            </h1>
                            <p className="text-base md:text-lg text-gray-400 font-light leading-relaxed mb-8 max-w-sm mx-auto lg:mx-0">
                                {stepData.description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex flex-col items-center lg:items-start gap-4 md:gap-6">
                        <motion.button
                            onClick={handleNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`group relative overflow-hidden rounded-2xl bg-white text-black pl-8 pr-6 py-3 md:py-4 text-base md:text-lg font-bold flex items-center gap-4 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]`}
                        >
                            <span className="relative z-10">{currentStep === steps.length - 1 ? 'Iniciar Ahora' : 'Continuar'}</span>
                            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors relative z-10">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </motion.button>

                        {currentStep < steps.length - 1 && (
                            <button
                                onClick={onComplete}
                                className="text-[10px] md:text-xs text-gray-600 hover:text-white transition-colors uppercase tracking-widest font-bold px-4 py-2"
                            >
                                Saltar Intro
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
