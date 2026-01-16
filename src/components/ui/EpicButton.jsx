import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

const EpicButton = ({ onClick, label = "Mostrar Todo", active = false }) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                relative group overflow-hidden px-8 py-3 rounded-2xl font-bold text-sm tracking-wide
                transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]
                ${active
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-none shadow-[0_0_30px_rgba(244,63,94,0.6)]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-white/10'
                }
            `}
        >
            {/* Animated Shine Effect */}
            <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

            {/* Background Glow Pulse */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl bg-cyan-400" />

            <div className="relative z-10 flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${active ? 'animate-spin-slow text-yellow-300' : 'text-cyan-100'}`} />
                <span>{label}</span>
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${active ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
            </div>
        </motion.button>
    );
};

export default EpicButton;
