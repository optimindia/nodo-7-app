import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { Search, Bell, LogOut, Settings as SettingsIcon, User, X, ChevronDown, CheckCheck, Loader2, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useNotifications } from '../../hooks/useNotifications';
import DashboardHome from '../../pages/dashboard/DashboardHome';
import Settings from '../../pages/dashboard/Settings';
import Wallets from '../../pages/dashboard/Wallets';
import Analytics from '../../pages/dashboard/Analytics';
import Goals from '../../pages/dashboard/Goals';
import AIChat from '../../pages/dashboard/AIChat';
import Categories from '../../pages/dashboard/Categories';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = ({ children, currentView, setCurrentView }) => {
    const { session } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Global Data Fetching (Lifted State)
    const { stats, transactions, wallets, goals, loading, formatCurrency } = useDashboardData();
    const { notifications, unreadCount, markAsRead, markAllRead, analyzeAndNotify, addNotification, deleteNotification } = useNotifications(session?.user);

    // Motivation Engine Trigger
    useEffect(() => {
        if (!loading && session?.user) {
            analyzeAndNotify(stats, goals, transactions);
        }
    }, [loading, stats, goals, transactions, session]);

    // Click outside handler
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const renderView = () => {
        // Shared Props for children
        const sharedProps = {
            searchQuery,
            stats,
            transactions,
            wallets,
            goals,
            loading,
            formatCurrency
        };

        switch (currentView) {
            case 'dashboard': return <DashboardHome {...sharedProps} />;
            case 'assets': return <Wallets {...sharedProps} />;
            case 'analytics': return <Analytics />;
            case 'goals': return <Goals {...sharedProps} />;
            case 'categories': return <Categories />;
            case 'ai-chat': return <AIChat />;
            case 'settings': return <Settings />;
            case 'admin': return <AdminDashboard />;
            default: return <DashboardHome {...sharedProps} />;
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#030712] text-white overflow-x-hidden selection:bg-cyan-500/30">
            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
            <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <main className="md:ml-64 min-h-screen relative p-4 md:p-8">
                {/* Top Header */}
                <div className="flex items-center justify-between mb-8 md:mb-12">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 text-white/70 hover:text-white bg-white/5 rounded-xl active:scale-95 transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">Panel Principal</h1>
                            <p className="text-white/40 text-xs md:text-sm">Resumen de tu actividad financiera</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Search */}
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar transacciones..."
                                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 w-64 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all hover:bg-white/10"
                            />
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isNotificationsOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70'}`}
                            >
                                <Bell className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-12 w-80 bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                            <h3 className="font-bold text-sm">Notificaciones</h3>
                                            <span className="text-xs text-white/40">{unreadCount} nuevas</span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-white/30 text-xs">
                                                    No tienes notificaciones
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => markAsRead(notif.id)}
                                                        className={`relative group p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-cyan-500/5' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1 pr-6">
                                                            <h4 className={`text-sm font-medium ${!notif.read ? 'text-cyan-400' : 'text-white'}`}>{notif.title}</h4>
                                                            <span className="text-[10px] text-white/30">
                                                                {new Date(notif.created_at).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/50 leading-relaxed">{notif.message}</p>

                                                        {/* Delete Button (Visible on Hover) */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                            className="absolute top-3 right-2 p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                            title="Eliminar"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {/* Footer - Always Visible */}
                                        <div className="p-2 border-t border-white/5 flex gap-1 justify-center bg-white/5">
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    className="flex-1 flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white font-medium py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                                >
                                                    <CheckCheck className="w-3 h-3" />
                                                    Leídas
                                                </button>
                                            )}
                                            <button
                                                onClick={() => addNotification('🚀 Notificación de Prueba', 'Este es un ejemplo de cómo el sistema te motivará.', 'motivation')}
                                                className="flex-1 flex items-center justify-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                                            >
                                                <Bell className="w-3 h-3" />
                                                Simular
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative pl-6 border-l border-white/10" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 group outline-none"
                            >
                                <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                                    <div className="text-sm font-medium text-white">{session?.user?.email?.split('@')[0]}</div>
                                    <div className="text-xs text-cyan-400">Miembro Pro</div>
                                </div>
                                <div className={`w-10 h-10 rounded-full p-[1px] transition-all ${isProfileOpen ? 'bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-gradient-to-r from-cyan-500 to-blue-600'}`}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${session?.user?.email}&background=0D8ABC&color=fff`}
                                        alt="Profile"
                                        className="w-full h-full rounded-full border-2 border-[#030712]"
                                    />
                                </div>
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-14 w-56 bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <p className="text-xs text-white/40 uppercase font-bold mb-1">Cuenta</p>
                                            <p className="text-sm font-medium truncate">{session?.user?.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => { setCurrentView('settings'); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white/70 hover:text-white transition-colors text-left"
                                            >
                                                <SettingsIcon className="w-4 h-4" />
                                                Configuración
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-sm text-rose-400 hover:text-rose-300 transition-colors text-left"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {renderView()}
            </main>
        </div>
    );
};

export default DashboardLayout;
