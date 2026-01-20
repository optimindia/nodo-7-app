import React, { useState } from 'react';
import {
    LayoutDashboard,
    Wallet,
    Target,
    Plus,
    Menu,
    X,
    Zap,
    ShoppingCart,
    TrendingDown,
    BarChart2,
    Tag,
    Settings,
    ShieldCheck,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUserRole } from '../../hooks/useUserRole';

const MobileNav = ({ currentView, setCurrentView, onOpenTransaction }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { session, signOut } = useAuth();
    const { canManageUsers } = useUserRole();

    const primaryTabs = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
        { id: 'assets', icon: Wallet, label: 'Billeteras' },
        // FAB is handled separately in render logic
        { id: 'goals', icon: Target, label: 'Metas' },
        { id: 'menu', icon: Menu, label: 'Menú', action: () => setIsMenuOpen(true) },
    ];

    const gridApps = [
        { id: 'ai-chat', icon: <Zap size={24} />, label: 'Asistente IA', color: 'bg-purple-500/10 text-purple-400', border: 'border-purple-500/20' },
        { id: 'analytics', icon: <BarChart2 size={24} />, label: 'Analíticas', color: 'bg-blue-500/10 text-blue-400', border: 'border-blue-500/20' },
        { id: 'shopping', icon: <ShoppingCart size={24} />, label: 'Compras', color: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/20' },
        { id: 'debts', icon: <TrendingDown size={24} />, label: 'Deudas', color: 'bg-rose-500/10 text-rose-400', border: 'border-rose-500/20' },
        { id: 'categories', icon: <Tag size={24} />, label: 'Categorías', color: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/20' },
        { id: 'settings', icon: <Settings size={24} />, label: 'Ajustes', color: 'bg-slate-500/10 text-slate-400', border: 'border-slate-500/20' },
    ];

    if (canManageUsers) {
        gridApps.push({ id: 'admin', icon: <ShieldCheck size={24} />, label: 'Admin', color: 'bg-red-500/10 text-red-500', border: 'border-red-500/20' });
    }

    const handleGridClick = (viewId) => {
        setCurrentView(viewId);
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        window.location.reload();
    };

    return (
        <>
            {/* FLOATING ISLAND CONTAINER */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 md:hidden px-4 pointer-events-none">

                {/* The Dock Itself (Glass Capsule) */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="pointer-events-auto bg-[#0A0F1E]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm flex items-center justify-between px-2 py-2 relative"
                >
                    {primaryTabs.map((item, index) => {
                        // INSERT FAB MIDDLE (Index 2)
                        if (index === 2) {
                            return (
                                <React.Fragment key="fab-group">
                                    {/* THE FAB (Floating Action Button) */}
                                    <div className="relative -top-8 mx-2 group">
                                        {/* Glow Effect */}
                                        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-40 group-active:opacity-60 transition-opacity" />

                                        <button
                                            onClick={onOpenTransaction}
                                            className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-2xl border-[4px] border-[#030712] text-white active:scale-90 active:rotate-90 transition-all duration-300 z-20"
                                        >
                                            <Plus size={32} strokeWidth={3} />
                                        </button>
                                    </div>

                                    {/* The actual loop item (Goals) */}
                                    <DockItem
                                        item={item}
                                        isActive={currentView === item.id}
                                        onClick={() => item.action ? item.action() : setCurrentView(item.id)}
                                    />
                                </React.Fragment>
                            )
                        }

                        return (
                            <DockItem
                                key={item.id}
                                item={item}
                                isActive={currentView === item.id}
                                onClick={() => item.action ? item.action() : setCurrentView(item.id)}
                            />
                        );
                    })}
                </motion.div>
            </div>

            {/* FULL SCREEN DRAWER OVERLAY */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Drawer Content */}
                        <motion.div
                            initial={{ y: '100%', scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: '100%', scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#0A0F1E] rounded-t-[2.5rem] border-t border-white/10 z-[60] md:hidden pb-10 max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Drag Handle */}
                            <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-8" />

                            <div className="flex-1 overflow-y-auto px-6 hide-scrollbar">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Menú</h3>
                                        <p className="text-sm text-white/40 font-medium">Todas tus aplicaciones</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {gridApps.map(app => (
                                        <button
                                            key={app.id}
                                            onClick={() => handleGridClick(app.id)}
                                            className={`
                             group relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5
                             active:scale-95 transition-all
                           `}
                                        >
                                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center text-white
                                ${app.color} border ${app.border} shadow-lg
                            `}>
                                                {app.icon}
                                            </div>
                                            <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">
                                                {app.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-400 font-bold active:scale-95 transition-transform"
                                >
                                    <LogOut size={20} />
                                    Cerrar Sesión
                                </button>
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// Sub-Component for individual Dock Icons with Layout Animation
const DockItem = ({ item, isActive, onClick }) => (
    <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center w-16 h-14 gap-1 z-10"
    >
        {/* Active Pill Background (Motion Layout) */}
        {isActive && !item.action && (
            <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-white/10 rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}

        {/* Icon with bounce */}
        <motion.div
            animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={isActive ? "text-cyan-400" : "text-gray-400"}
        >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </motion.div>

        {/* Label (Optional: hide when active or show small dot) */}
        {isActive && !item.action && (
            <motion.div
                layoutId="activeDot"
                className="w-1 h-1 rounded-full bg-cyan-400 absolute bottom-1"
            />
        )}
    </button>
);

export default MobileNav;
