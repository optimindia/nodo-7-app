import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings as SettingsIcon, CreditCard, Save, Loader2, Globe, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Settings = () => {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Feedback State
    const [feedback, setFeedback] = useState({ type: null, message: '' }); // { type: 'success' | 'error', message: '' }

    // Profile Form Data
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        bio: '',
        currency: 'USD',
        language: 'es',
        notifications_enabled: true
    });

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    // Clear feedback after 3 seconds
    useEffect(() => {
        if (feedback.message) {
            const timer = setTimeout(() => setFeedback({ type: null, message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    username: data.username || '',
                    bio: data.bio || '',
                    currency: data.currency || 'USD',
                    language: data.language || 'es',
                    notifications_enabled: data.notifications_enabled !== false // Default true
                });
            } else if (error && error.code !== 'PGRST116') {
                // Ignore "No rows found" error (PGRST116), handle others
                console.error("Error fetching profile:", error);
            }
            // If no data, formData stays with defaults which is fine for new users
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setFeedback({ type: null, message: '' });

        try {
            console.log("Iniciando guardado de perfil para:", user.id);

            // Prepare payload
            const updates = {
                id: user.id, // Primary Key for Upsert
                email: user.email, // Sync email just in case
                full_name: formData.full_name,
                username: formData.username,
                bio: formData.bio,
                currency: formData.currency,
                language: formData.language,
                notifications_enabled: formData.notifications_enabled,
                updated_at: new Date()
            };

            // UPSERT: Handles both Update (if exists) and Insert (if new) atomically.
            // This avoids "Row not found" or "Duplicate key" errors caused by RLS latency or race conditions.
            const { data, error } = await supabase
                .from('profiles')
                .upsert(updates, { onConflict: 'id' })
                .select();

            if (error) {
                console.error("Error en Upsert BD:", error);
                throw error;
            }

            console.log("Guardado exitoso:", data);
            setFeedback({ type: 'success', message: 'Perfil actualizado correctamente' });

            // Refresh local data to be sure
            await fetchProfile();
            // Refresh global context
            await refreshProfile();

        } catch (error) {
            console.error('Error final en handleSave:', error);
            setFeedback({ type: 'error', message: 'Error al guardar: ' + (error.message || 'Error desconocido') });
        } finally {
            setSaving(false);
        }
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium whitespace-nowrap ${activeTab === id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Ajustes</h1>
                <p className="text-white/60">Gestiona tus preferencias personales y de cuenta.</p>
            </div>

            {/* Notification Banner */}
            <AnimatePresence>
                {feedback.message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                    >
                        {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-bold">{feedback.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
                <TabButton id="profile" icon={User} label="Perfil" />
                <TabButton id="preferences" icon={SettingsIcon} label="Preferencias" />
                <TabButton id="account" icon={Shield} label="Cuenta" />
            </div>

            <div className="glass-panel p-4 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="relative z-10 flex-1">

                    {/* --- PROFILE TAB --- */}
                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Información Personal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Nombre de Usuario</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                        placeholder="@usuario"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/60">Biografía</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full h-32 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors resize-none"
                                    placeholder="Cuéntanos un poco sobre ti..."
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* --- PREFERENCES TAB --- */}
                    {activeTab === 'preferences' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl">

                            {/* Currency Selector */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-cyan-400 mb-2">
                                    <CreditCard className="w-5 h-5" />
                                    <h3 className="font-bold text-lg text-white">Moneda Principal</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                    {['USD', 'EUR', 'MXN', 'COP', 'ARS'].map(curr => (
                                        <button
                                            key={curr}
                                            onClick={() => setFormData({ ...formData, currency: curr })}
                                            className={`px-4 py-3 rounded-xl border transition-all text-left font-medium ${formData.currency === curr
                                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/5'
                                                }`}
                                        >
                                            {curr}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-white/40">Esto cambiará cómo se muestran los balances en todo el panel.</p>
                            </div>

                            <div className="border-t border-white/10" />

                            {/* Language Selector */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-cyan-400 mb-2">
                                    <Globe className="w-5 h-5" />
                                    <h3 className="font-bold text-lg text-white">Idioma</h3>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, language: 'es' })}
                                        className={`flex-1 px-4 py-3 rounded-xl border transition-all font-medium ${formData.language === 'es'
                                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                            : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/5'
                                            }`}
                                    >
                                        Español
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, language: 'en' })}
                                        className={`flex-1 px-4 py-3 rounded-xl border transition-all font-medium ${formData.language === 'en'
                                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                            : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/5'
                                            }`}
                                    >
                                        English
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- ACCOUNT TAB --- */}
                    {activeTab === 'account' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-2xl">
                            <div className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Tu Plan Actual</div>
                                    <div className="text-2xl font-bold text-white">Miembro Estándar</div>
                                </div>
                                <button className="w-full md:w-auto px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90">
                                    Mejorar Plan
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/60">Email (No editable)</label>
                                <div className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/40 cursor-not-allowed">
                                    {user.email}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => supabase.auth.signOut()}
                                    className="w-full md:w-auto px-4 py-2 text-pink-500 hover:text-pink-400 text-sm font-medium transition-colors border border-pink-500/20 rounded-lg hover:bg-pink-500/10"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Global Save Button - Only for tabs that need saving (Profile, Preferences) */}
                {(activeTab === 'profile' || activeTab === 'preferences') && (
                    <div className="mt-8 md:mt-0 md:absolute md:bottom-8 md:right-8 z-20">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Guardar Cambios
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Settings;
