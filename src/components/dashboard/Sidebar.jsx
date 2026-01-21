import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Wallet,
    Activity,
    Settings,
    BarChart2,
    LogOut,
    Zap,
    Box,
    Tag,
    X,
    ShieldCheck,
    ShoppingCart,
    TrendingDown
} from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
    { id: 'assets', icon: Wallet, label: 'Billeteras' },
    { id: 'analytics', icon: BarChart2, label: 'Analíticas' },
    { id: 'shopping', icon: ShoppingCart, label: 'Compras' },
    { id: 'debts', icon: TrendingDown, label: 'Deudas' },
    { id: 'goals', icon: Box, label: 'Metas' },
    { id: 'ai-chat', icon: Zap, label: 'Asistente IA' },
    { id: 'categories', icon: Tag, label: 'Categorías' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
];

const Sidebar = ({ currentView, setCurrentView, isOpen, onClose }) => {
    const { signOut } = useAuth();
    const { canManageUsers } = useUserRole();

    const displayItems = canManageUsers
        ? [...menuItems, { id: 'admin', icon: ShieldCheck, label: 'Panel Admin' }]
        : menuItems;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className="p-8 pb-4 flex justify-between items-center">
                <div className="flex items-center justify-center w-full">
                    <img
                        src="/logo.svg"
                        alt="OptiCash Logo"
                        className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                    />
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-white/50 hover:text-white bg-white/5 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {displayItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <motion.button
                            key={item.label}
                            onClick={() => {
                                setCurrentView(item.id);
                                onClose?.(); // Close on selection (mobile)
                            }}
                            whileHover={{ x: 4 }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-white/40 group-hover:text-cyan-400'}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeGlow"
                                    className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-r-full blur-[4px]"
                                />
                            )}
                        </motion.button>
                    )
                })}
            </nav>

            {/* User / Logout */}
            <div className="p-4 border-t border-white/5 mx-4 mb-4">
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 w-full p-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Static) */}
            <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 flex-col border-r border-white/5 bg-[#030712]/50 backdrop-blur-xl z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed left-0 top-0 w-[85%] max-w-[300px] h-screen bg-[#0f172a] border-r border-white/10 z-50 md:hidden shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
