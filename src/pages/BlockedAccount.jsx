import React from 'react';
import { ShieldAlert, MessageCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const BlockedAccount = () => {
    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative z-10 max-w-md w-full bg-white/5 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(220,38,38,0.1)] text-center"
            >
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"
                >
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </motion.div>

                <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
                <p className="text-white/60 mb-8 text-sm leading-relaxed">
                    Tu cuenta ha sido <span className="text-red-400 font-bold">BLOQUEADA</span> temporalmente o desactivada por falta de pago o incumplimiento de términos.
                </p>

                <div className="space-y-3">
                    <a
                        href="https://wa.me/5492616027055?text=Hola,%20mi%20cuenta%20de%20OptiCash%20está%20bloqueada.%20Necesito%20ayuda."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 group"
                    >
                        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Contactar Soporte
                    </a>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        Intentar nuevamente
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">
                        OptiCash Security System
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default BlockedAccount;
