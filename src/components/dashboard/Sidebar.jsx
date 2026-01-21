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
    TrendingDown,
    PieChart,
    ChevronLeft
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
    { id: 'budgets', icon: PieChart, label: 'Presupuestos' }, // Added Budgets
    { id: 'ai-chat', icon: Zap, label: 'Asistente IA' },
    { id: 'categories', icon: Tag, label: 'Categorías' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
];

const Sidebar = ({ currentView, setCurrentView, isOpen, onClose, isCollapsed = false, toggleCollapse }) => {
    const { signOut } = useAuth();
    const { canManageUsers } = useUserRole();

    const displayItems = canManageUsers
        ? [...menuItems, { id: 'admin', icon: ShieldCheck, label: 'Panel Admin' }]
        : menuItems;

    const SidebarContent = () => (
        <div className="flex flex-col h-full relative">
            {/* Logo Area */}
            <div className={`p-4 flex items-center h-16 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between px-5'}`}>
                <div className="flex items-center justify-center overflow-hidden">
                    {/* Dynamic Logo Sizing */}
                    <AnimatePresence mode="wait">
                        {isCollapsed ? (
                            <motion.img
                                key="small-logo"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                src="/icon.svg"
                                alt="OptiCash"
                                className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                            />
                        ) : (
                            <motion.img
                                key="full-logo"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                src="/logo.svg"
                                alt="OptiCash Logo"
                                className="h-8 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Toggle Button (Desktop Only) */}
            {toggleCollapse && (
                <button
                    onClick={toggleCollapse}
                    className="hidden md:flex absolute -right-3 top-20 w-5 h-5 bg-cyan-500 border-2 border-[#030712] rounded-full items-center justify-center text-black z-50 hover:scale-110 transition-transform shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                >
                    <motion.div
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronLeft size={12} className="text-black" />
                    </motion.div>
                </button>
            )}

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-2 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                {/* CSS for no-scrollbar: scrollbar-width: none; -ms-overflow-style: none; &::-webkit-scrollbar { display: none; } */}
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                {displayItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <motion.button
                            key={item.label}
                            onClick={() => {
                                setCurrentView(item.id);
                                onClose?.(); // Close on selection (mobile)
                            }}
                            initial={false}
                            className={`relative flex items-center transition-all duration-300 group rounded-lg
                                ${isCollapsed
                                    ? 'justify-center w-full aspect-square p-0'
                                    : 'w-full gap-3 px-3 py-3' /* Expanded: py-3 for comfortable size */
                                }
                                ${isActive
                                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            {/* Icon */}
                            <div className="relative z-10">
                                <item.icon
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-colors duration-300 
                                    ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} /* Standardized icon size slightly bigger for expanded too */
                                    ${isActive ? 'text-cyan-400' : 'text-white/40 group-hover:text-cyan-400'}`}
                                />
                            </div>

                            {/* Label (Expanded) */}
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-medium text-sm whitespace-nowrap" /* Back to text-sm */
                                >
                                    {item.label}
                                </motion.span>
                            )}

                            {/* Tooltip (Collapsed) */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity translate-x-2 whitespace-nowrap z-50 shadow-xl">
                                    {item.label}
                                    {/* Arrow */}
                                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-white/10 rotate-45" />
                                </div>
                            )}

                            {/* Active Glow Bar */}
                            {isActive && !isCollapsed && (
                                <motion.div
                                    layoutId="activeGlow"
                                    className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full blur-[2px]"
                                />
                            )}
                        </motion.button>
                    )
                })}
            </nav>

            {/* User / Logout */}
            <div className={`p-4 mx-2 mt-auto border-t border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <button
                    onClick={signOut}
                    className={`flex items-center transition-colors text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl
                        ${isCollapsed
                            ? 'justify-center w-12 h-12 p-0'
                            : 'w-full gap-3 p-3'
                        }`}
                    title={isCollapsed ? "Cerrar Sesión" : ""}
                >
                    <LogOut className={`w-5 h-5 ${isCollapsed ? 'text-red-400' : ''}`} />
                    {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Animated Width) */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 256 }} // 80px (w-20) vs 256px (w-64)
                transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }} // smooth easeOutCubic
                className="hidden md:flex h-screen fixed left-0 top-0 flex-col border-r border-white/5 bg-[#030712]/80 backdrop-blur-xl z-50 overflow-visible" // overflow-visible for button
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Sidebar (Drawer) - Unchanged */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
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
