import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Tag, Wallet, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useGoals } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../context/AuthContext';

const TransactionModal = ({ isOpen, onClose, onTransactionAdded, userId, initialData }) => {
    const { user } = useAuth();
    const { goals } = useGoals();
    const { categories } = useCategories();

    // Form States
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [type, setType] = useState(initialData?.type || 'expense');
    const [category, setCategory] = useState(initialData?.category || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [selectedGoal, setSelectedGoal] = useState(initialData?.goal_id || '');

    // Wallets
    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(initialData?.wallet_id || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch Wallets on mount/open
    useEffect(() => {
        const fetchWallets = async () => {
            const targetUserId = user?.id || userId;
            if (!targetUserId) return;

            // USE RPC: Secure Fetch
            const { data } = await supabase.rpc('get_wallets_secure', { p_user_id: targetUserId });
            if (data) {
                setWallets(data);
                if (data.length > 0 && !selectedWallet) setSelectedWallet(data[0].id);
            }
        };
        if (isOpen) fetchWallets();
    }, [isOpen, user, userId]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setDescription('');
            setType('expense');
            setCategory('');
            setSuccess(false);
            setError(null);
        }
    }, [isOpen]);

    const activeCategories = categories.filter(c => c.type === (type === 'deposit' ? 'income' : 'expense'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Smart Defaults
            const finalDesc = description.trim() || category || (type === 'deposit' ? 'Ingreso' : 'Gasto');
            const finalCategory = category || 'General';

            const targetUserId = user?.id || userId;
            const isDeposit = type === 'deposit';

            let txOperation;

            if (initialData?.id) {
                // UPDATE RPC
                txOperation = await supabase.rpc('update_transaction_secure', {
                    p_tx_id: initialData.id,
                    p_amount: parseFloat(amount),
                    p_type: isDeposit ? 'deposit' : 'withdrawal',
                    p_description: finalDesc,
                    p_category: finalCategory,
                    p_date: date,
                    p_wallet_id: selectedWallet
                });
            } else {
                // CREATE RPC
                txOperation = await supabase.rpc('create_transaction_secure', {
                    p_user_id: targetUserId,
                    p_wallet_id: selectedWallet,
                    p_amount: parseFloat(amount),
                    p_type: isDeposit ? 'deposit' : 'withdrawal',
                    p_description: finalDesc,
                    p_category: finalCategory,
                    p_date: date
                });
            }

            const { error: txError } = txOperation;
            if (txError) throw txError;

            // 2. Update Goal (Only on Create & Deposit)
            // Prevent double counting on edits for now
            if (!initialData?.id && selectedGoal && isDeposit) {
                const goal = goals.find(g => g.id === selectedGoal);
                if (goal) {
                    const newAmount = (Number(goal.current_amount) || 0) + parseFloat(amount);
                    // GOAL UPDATE RPC
                    await supabase.rpc('update_goal_amount_secure', {
                        p_goal_id: selectedGoal,
                        p_current_amount: newAmount
                    });
                }
            }

            setSuccess(true);
            setTimeout(() => {
                if (onTransactionAdded) onTransactionAdded();
                onClose();
            }, 800);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        // REMOVED OVERFLOW HIDDEN HERE to allow dropdowns to pop out
                        className="relative w-full max-w-md bg-[#0f172a] md:rounded-3xl rounded-t-3xl border-t md:border border-white/10 shadow-2xl"
                    >
                        {/* Status Bar for Success */}
                        {success ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-emerald-500/10">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white">¡Guardado!</h3>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 pb-8">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => { setType('expense'); setCategory(''); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-pink-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            Gasto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setType('deposit'); setCategory(''); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'deposit' ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            Ingreso
                                        </button>
                                    </div>
                                    <button onClick={onClose} type="button" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/60">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Hero Amount Input */}
                                <div className="mb-8 text-center relative">
                                    <span className="text-4xl font-bold text-white/40 absolute left-8 top-1/2 -translate-y-1/2">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-transparent text-center text-6xl font-bold text-white placeholder:text-white/10 focus:outline-none"
                                        autoFocus
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                    {type === 'deposit' && selectedGoal && (
                                        <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                                            Destinado a meta
                                        </div>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-4">
                                    {/* Category Scroll */}
                                    <div>
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1 mb-2 block">Categoría</label>
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {activeCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategory(cat.name)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${category === cat.name
                                                        ? `bg-${cat.color}-500/20 border-${cat.color}-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]`
                                                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span>{cat.icon}</span>
                                                    <span className="font-bold text-sm">{cat.name}</span>
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="px-4 py-2 rounded-xl border border-dashed border-white/10 text-white/20 text-sm hover:text-white/60 hover:border-white/20 transition-colors"
                                            >
                                                + Nueva
                                            </button>
                                        </div>
                                    </div>

                                    {/* Row: Wallet & Date */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1 relative z-20">
                                            <label className="text-xs font-bold text-white/40 uppercase ml-1">Billetera</label>
                                            <div className="relative">
                                                <Wallet className="absolute left-3 top-3 w-4 h-4 text-white/40 z-10" />
                                                <select
                                                    value={selectedWallet}
                                                    onChange={e => setSelectedWallet(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors relative z-20"
                                                    required
                                                >
                                                    {wallets.length === 0 ? (
                                                        <option value="" className="bg-[#0f172a] text-white/40">Cargando...</option>
                                                    ) : (
                                                        <>
                                                            <option value="" className="bg-[#0f172a] text-white/40">Seleccionar...</option>
                                                            {wallets.map(w => (
                                                                <option key={w.id} value={w.id} className="bg-[#0f172a] text-white">
                                                                    {w.name}
                                                                </option>
                                                            ))}
                                                        </>
                                                    )}
                                                </select>
                                                {/* Custom Arrow */}
                                                <div className="absolute right-3 top-3 pointer-events-none z-30">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L9 1" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-white/40 uppercase ml-1">Fecha</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={e => setDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional Description */}
                                    <div>
                                        <input
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Descripción (Opcional)"
                                            className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                                        />
                                    </div>

                                    {/* Link to Goal (Only Deposits) */}
                                    {type === 'deposit' && (
                                        <div className="pt-2">
                                            <select
                                                value={selectedGoal}
                                                onChange={e => setSelectedGoal(e.target.value)}
                                                className="w-full bg-gradient-to-r from-emerald-900/10 to-transparent border border-emerald-500/20 rounded-xl py-3 px-4 text-sm text-emerald-400 focus:outline-none"
                                            >
                                                <option value="">🎯  ¿Destinar a una meta? (Opcional)</option>
                                                {goals.map(g => (
                                                    <option key={g.id} value={g.id}>{g.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading || !amount || !selectedWallet}
                                        className="w-full py-4 mt-4 bg-white text-black font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    >
                                        {loading ? 'Guardando...' : (type === 'deposit' ? 'Ingresar Dinero' : 'Registrar Gasto')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TransactionModal;
