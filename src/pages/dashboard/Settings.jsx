import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings as SettingsIcon, Bell, Shield, Save, Camera, Mail, AtSign, Globe, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } = '../../lib/supabaseClient';

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
        setFeedback({ type: null, message: '' }); // Clear previous feedback

        try {
            console.log("Iniciando guardado de perfil para:", user.id);

            // 1. Check if profile exists
            const { count, error: checkError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('id', user.id);

            if (checkError) {
                console.error("Error verificando existencia de perfil:", checkError);
                throw checkError;
            }

            const profileExists = count > 0;
            console.log("Perfil existe:", profileExists);

            let error;

            if (profileExists) {
                // 2. Update existing
                console.log("Actualizando perfil existente...");
                const result = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        username: formData.username,
                        bio: formData.bio,
                        currency: formData.currency,
                        language: formData.language,
                        notifications_enabled: formData.notifications_enabled,
                        updated_at: new Date()
                    })
                    .eq('id', user.id);
                error = result.error;
            } else {
                // 3. Insert new
                console.log("Creando nuevo perfil...");
                const result = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        full_name: formData.full_name,
                        username: formData.username,
                        bio: formData.bio,
                        currency: formData.currency,
                        language: formData.language,
                        notifications_enabled: formData.notifications_enabled,
                        created_at: new Date(),
                        updated_at: new Date()
                    }]);
                error = result.error;
            }

            if (error) {
                console.error("Error en operación BD:", error);
                throw error;
            }

            console.log("Guardado exitoso");
            setFeedback({ type: 'success', message: 'Perfil guardado correctamente' });

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
                            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-6 md:p-8">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-400" />
                                    Información Personal
                                </h2>

                                <div className="space-y-6">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl font-bold text-cyan-400">
                                            {formData.full_name?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white mb-1">Foto de Perfil</h3>
                                            <p className="text-sm text-white/40 mb-3">Se usa Gravatar o UI Avatars basado en tu nombre.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm text-white/60">Nombre Completo</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-2.5 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                                                    placeholder="Tu nombre"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-white/60">Nombre de Usuario</label>
                                            <div className="relative group">
                                                <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                                                    placeholder="@usuario"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm text-white/60">Biografía</label>
                                            <textarea
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all h-24 resize-none"
                                                placeholder="Cuéntanos un poco sobre ti..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- PREFERENCES TAB --- */}
                    {activeTab === 'preferences' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-2xl">
                            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-6 md:p-8">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <SettingsIcon className="w-5 h-5 text-cyan-400" />
                                    Preferencias
                                </h2>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">Moneda Principal</label>
                                        <div className="relative group">
                                            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                                            <select
                                                value={formData.currency}
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all appearance-none"
                                            >
                                                <option value="USD">Dólar Estadounidense (USD)</option>
                                                <option value="EUR">Euro (EUR)</option>
                                                <option value="MXN">Peso Mexicano (MXN)</option>
                                                <option value="COP">Peso Colombiano (COP)</option>
                                                <option value="ARS">Peso Argentino (ARS)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/60">Idioma</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                                            <select
                                                value={formData.language}
                                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all appearance-none"
                                            >
                                                <option value="es">Español</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-white">Notificaciones</h3>
                                                <p className="text-xs text-white/40">Recibir alertas de actividad y consejos</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.notifications_enabled}
                                                onChange={(e) => setFormData({ ...formData, notifications_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                        </label>
                                    </div>
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
