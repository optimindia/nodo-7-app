import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, CreditCard, Wallet, Target, Check, ChevronRight, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';

const steps = [
    { id: 'profile', title: 'Tu Perfil', icon: User },
    { id: 'preferences', title: 'Preferencias', icon: CreditCard },
    { id: 'wallet', title: 'Primera Billetera', icon: Wallet },
    { id: 'goals', title: 'Tus Metas', icon: Target },
    { id: 'complete', title: '¡Listo!', icon: Sparkles }
];

const UserSetupWizard = ({ onComplete }) => {
    const { user, setHasCompletedSetup } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form States
    const [profileData, setProfileData] = useState({
        full_name: user?.user_metadata?.full_name || '',
        username: user?.email?.split('@')[0] || '',
        bio: ''
    });

    const [currency, setCurrency] = useState('USD');

    // Multiple Wallets State
    const [walletsList, setWalletsList] = useState([]);
    const [newWallet, setNewWallet] = useState({
        name: '',
        type: 'general',
        amount: '',
        color: '#10B981'
    });

    const [goal, setGoal] = useState({
        title: '',
        target_amount: ''
    });

    const handleAddWallet = () => {
        if (!newWallet.name) return;
        setWalletsList([...walletsList, { ...newWallet, id: Date.now() }]);
        setNewWallet({ name: '', type: 'general', amount: '', color: '#10B981' }); // Reset form
    };

    const handleRemoveWallet = (id) => {
        setWalletsList(walletsList.filter(w => w.id !== id));
    };

    const handleNext = async () => {
        if (currentStep === steps.length - 2) { // Determine final step before 'complete'
            await finalizeSetup();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const finalizeSetup = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: profileData.full_name,
                    username: profileData.username,
                    bio: profileData.bio,
                    currency: currency,
                    has_completed_setup: true,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Create Wallets (Loop through list)
            if (walletsList.length > 0) {
                for (const walletItem of walletsList) {
                    // Insert Wallet with Initial Balance
                    const { error: walletError } = await supabase
                        .from('wallets')
                        .insert([{
                            user_id: user.id,
                            name: walletItem.name,
                            color: walletItem.color,
                            type: walletItem.type,
                            initial_balance: parseFloat(walletItem.amount || 0)
                        }]);

                    if (walletError) throw walletError;
                }
            }

            // 3. Create Goal (Optional)
            if (goal.title && goal.target_amount) {
                const { error: goalError } = await supabase
                    .from('goals')
                    .insert([{
                        user_id: user.id,
                        title: goal.title,
                        target_amount: parseFloat(goal.target_amount),
                        current_amount: 0,
                        deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default 1 year
                        status: 'active',
                        icon: 'Target',
                        color: '#8B5CF6'
                    }]);

                if (goalError) throw goalError;
            }

            // Success! Move to completion screen
            setHasCompletedSetup(true); // Update context locally
            setCurrentStep(prev => prev + 1);

            // Wait a bit on the completion screen then redirect
            setTimeout(() => {
                if (onComplete) onComplete();
                window.location.reload();
            }, 2000);

        } catch (err) {
            console.error("Setup Error:", err);
            const errorMessage = err.message || "Hubo un error al guardar tu configuración.";
            const errorDetails = err.details || err.hint || "";
            setError(`${errorMessage} ${errorDetails ? `(${errorDetails})` : ''}`);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={profileData.full_name}
                                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                    placeholder="@juanperez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Biografía (Opcional)</label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors resize-none"
                                    placeholder="¿Cuál es tu objetivo financiero?"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                        <p className="text-white/60">Elige la moneda principal para mostrar tus balances. Podrás cambiarla después.</p>
                        <div className="grid grid-cols-2 gap-4">
                            {['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP'].map(curr => (
                                <button
                                    key={curr}
                                    onClick={() => setCurrency(curr)}
                                    className={`p-4 rounded-xl border text-center transition-all ${currency === curr
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <p className="text-white/60">Agrega tus billeteras y cuentas con sus saldos iniciales.</p>

                        {/* List of Added Wallets */}
                        {walletsList.length > 0 && (
                            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                                {walletsList.map(w => (
                                    <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/20 text-cyan-400">
                                                <Wallet className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{w.name}</p>
                                                <p className="text-xs text-white/50">{w.type === 'general' ? 'General' : w.type === 'cash' ? 'Efectivo' : w.type === 'bank' ? 'Banco' : 'Cripto'} • {w.amount ? `$${w.amount}` : '$0'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveWallet(w.id)} className="p-2 text-white/30 hover:text-rose-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Wallet Form */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={newWallet.name}
                                    onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                                    placeholder="Ej. Efectivo, Banco"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1">Tipo</label>
                                    <select
                                        value={newWallet.type}
                                        onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                                    >
                                        <option value="general">General</option>
                                        <option value="cash">Efectivo</option>
                                        <option value="bank">Banco</option>
                                        <option value="crypto">Cripto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1">Saldo</label>
                                    <input
                                        type="number"
                                        value={newWallet.amount}
                                        onChange={(e) => setNewWallet({ ...newWallet, amount: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddWallet}
                                disabled={!newWallet.name}
                                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Billetera
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <p className="text-white/60">¿Tienes alguna meta financiera en mente? (Opcional)</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Nombre de la Meta</label>
                                <input
                                    type="text"
                                    value={goal.title}
                                    onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                    placeholder="Ej. Comprar Laptop, Viaje, Coche"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Monto Objetivo</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={goal.target_amount}
                                        onChange={(e) => setGoal({ ...goal, target_amount: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <Check className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">¡Todo Listo!</h2>
                        <p className="text-white/60 max-w-sm">
                            Tu cuenta ha sido configurada exitosamente. Estamos preparándolo todo para ti...
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative shadow-2xl"
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600`}>
                                {React.createElement(steps[currentStep].icon, { className: "w-6 h-6 text-white" })}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{steps[currentStep].title}</h1>
                                <p className="text-xs text-white/40">Paso {currentStep + 1} de {steps.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                {currentStep < steps.length - 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                            >
                                Atrás
                            </button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {currentStep === steps.length - 2 ? 'Finalizar' : 'Continuar'}
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl text-center">
                        {error}
                    </div>
                )}

            </motion.div>
        </div>
    );
};

export default UserSetupWizard;
