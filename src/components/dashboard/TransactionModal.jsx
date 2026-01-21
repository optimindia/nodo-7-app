import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Tag, Wallet, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useGoals } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getLocalDateISOString } from '../../utils/format';

// Helper: Format number to Argentine string (1.000,00)
const formatNumber = (val) => {
    if (!val && val !== 0) return '';
    val = val.toString().replace('.', ','); // Simply replace first dot (JS float) with comma

    const parts = val.split(',');
    const integerPart = parts[0].replace(/\D/g, ''); // Only numbers
    const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // If original had valid decimal part
    if (parts.length > 1) {
        return `${formattedInt},${parts[1].slice(0, 2)}`;
    }
    return formattedInt;
};

const TransactionModal = ({ isOpen, onClose, onTransactionAdded, userId, initialData, wallets: propWallets }) => {
    const { user } = useAuth();
    const { goals } = useGoals();
    const { categories, addCategory } = useCategories();

    // Form States
    const [amount, setAmount] = useState(initialData?.amount ? formatNumber(initialData.amount) : '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [type, setType] = useState(initialData?.type || 'expense');
    const [category, setCategory] = useState(initialData?.category || '');
    const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : getLocalDateISOString());
    const [selectedGoal, setSelectedGoal] = useState(initialData?.goal_id || '');

    // Category Creation State
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Wallets (Use props if available, otherwise fallback)
    const [localWallets, setLocalWallets] = useState([]);
    const activeWallets = propWallets || localWallets;

    // Wallet Selector UI State
    const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(initialData?.wallet_id || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch Wallets logic only if props not provided (Fallback)
    useEffect(() => {
        if (propWallets) {
            // If props provided, just ensure default selection if available
            if (propWallets.length > 0 && !selectedWallet && !initialData?.wallet_id) setSelectedWallet(propWallets[0].id);
            return;
        }

        const fetchWallets = async () => {
            const targetUserId = user?.id || userId;
            if (!targetUserId) return;
            const { data } = await supabase.from('wallets').select('*').eq('user_id', targetUserId);
            if (data) {
                setLocalWallets(data);
                if (data.length > 0 && !selectedWallet) setSelectedWallet(data[0].id);
            }
        };
        if (isOpen) fetchWallets();
    }, [isOpen, user, userId, propWallets]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setDescription('');
            setType('expense');
            setCategory('');
            setSuccess(false);
            setError(null);
            setIsWalletSelectorOpen(false);
            setDate(getLocalDateISOString()); // Reset to proper local today
        }
    }, [isOpen]);

    const activeCategories = categories.filter(c => c.type === (type === 'deposit' ? 'income' : 'expense'));

    const handleAmountChange = (e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9,]/g, '');
        const parts = val.split(',');
        const integerPart = parts[0].replace(/\./g, '');
        const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        if (parts.length > 1) {
            const decimalPart = parts[1].slice(0, 2);
            setAmount(`${formattedInt},${decimalPart}`);
        } else {
            if (e.nativeEvent.data === ',') {
                setAmount(`${formattedInt},`);
            } else {
                setAmount(formattedInt);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Parse Amount: "1.234,50" -> 1234.50
            const rawAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

            if (isNaN(rawAmount) || rawAmount <= 0) throw new Error("Monto inválido");

            // Smart Defaults
            const finalDesc = description.trim() || category || (type === 'deposit' ? 'Ingreso' : 'Gasto');
            const finalCategory = category || 'General';

            const targetUserId = user?.id || userId;

            // 1. Determine Correct Time ISO
            // If user selected "Today", use CURRENT TIME to preserve exact moment
            // If user selected another day, use Noon (12:00) to safely land in that day regardless of timezone shifts
            const todayISO = getLocalDateISOString();
            let finalDateISO;

            if (date === todayISO) {
                finalDateISO = new Date().toISOString(); // Current timestamp for real-time accuracy
            } else {
                finalDateISO = new Date(date + 'T12:00:00').toISOString(); // Safe mid-day for past/future
            }

            // 2. Transaction Operation
            let txOperation;

            const payload = {
                user_id: targetUserId,
                amount: rawAmount,
                description: finalDesc,
                type: type === 'deposit' ? 'deposit' : 'withdrawal',
                category: finalCategory,
                date: finalDateISO,
                wallet_id: selectedWallet,
                goal_id: selectedGoal || null
            };

            if (initialData?.id) {
                txOperation = await supabase.from('transactions').update(payload).eq('id', initialData.id);
            } else {
                txOperation = await supabase.from('transactions').insert([payload]);
            }

            const { error: txError } = txOperation;
            if (txError) throw txError;

            if (!initialData?.id && selectedGoal && type === 'deposit') {
                const goal = goals.find(g => g.id === selectedGoal);
                if (goal) {
                    const newAmount = (Number(goal.current_amount) || 0) + rawAmount;
                    await supabase.from('goals').update({ current_amount: newAmount }).eq('id', selectedGoal);
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

    // Find current wallet object
    const currentWalletObj = activeWallets.find(w => w.id === selectedWallet);

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
                        // MOBILE: h-[100dvh], rounded-none, w-full
                        // DESKTOP: md:h-auto, md:max-h-[85vh], md:rounded-3xl, max-w-md
                        className="relative w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-md bg-[#0f172a] md:rounded-3xl rounded-none border-t md:border border-white/10 shadow-2xl overflow-y-auto flex flex-col"
                    >
                        {/* Status Bar for Success */}
                        {success ? (
                            <div className="h-full md:h-[400px] flex flex-col items-center justify-center gap-4 bg-emerald-500/10">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white">¡Guardado!</h3>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-4 md:p-6 pb-20 md:pb-8 flex-1">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6 md:mb-6 pt-2 md:pt-0">
                                    <h2 className="text-white/60 font-bold text-lg md:hidden">Nueva Transacción</h2>
                                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl hidden md:flex">
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

                                {/* Mobile Toggle (Visible only on mobile) */}
                                <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 md:hidden">
                                    <button
                                        type="button"
                                        onClick={() => { setType('expense'); setCategory(''); }}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-pink-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setType('deposit'); setCategory(''); }}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === 'deposit' ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Ingreso
                                    </button>
                                </div>

                                {/* Hero Amount Input */}
                                <div className="mb-6 md:mb-8 text-center relative">
                                    <span className="text-2xl md:text-4xl font-bold text-white/40 absolute left-8 md:left-14 top-1/2 -translate-y-1/2">$</span>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0,00"
                                        className="w-full bg-transparent text-center text-5xl md:text-6xl font-bold text-white placeholder:text-white/10 focus:outline-none"
                                        autoFocus
                                        required
                                        inputMode="decimal"
                                    />
                                    {type === 'deposit' && selectedGoal && (
                                        <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                                            Destinado a meta
                                        </div>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-6 md:space-y-4">
                                    {/* Category Scroll */}
                                    <div>
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1 mb-2 block">Categoría</label>
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {activeCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategory(cat.name)}
                                                    className={`flex items-center gap-2 px-4 py-3 md:py-2 rounded-xl border whitespace-nowrap transition-all ${category === cat.name
                                                        ? `bg-${cat.color}-500/20 border-${cat.color}-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]`
                                                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span>{cat.icon}</span>
                                                    <span className="font-bold text-sm">{cat.name}</span>
                                                </button>
                                            ))}
                                            {isCreatingCategory ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        autoFocus
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Nombre..."
                                                        className="w-32 px-3 py-2 rounded-xl bg-white/10 border border-cyan-500/50 text-sm text-white focus:outline-none"
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                if (!newCategoryName.trim()) return;
                                                                try {
                                                                    const newCat = await addCategory({
                                                                        name: newCategoryName,
                                                                        type: type === 'deposit' ? 'income' : 'expense',
                                                                        icon: '✨', // Default icon
                                                                        color: 'cyan' // Default color
                                                                    });
                                                                    setCategory(newCat.name);
                                                                    setIsCreatingCategory(false);
                                                                    setNewCategoryName('');
                                                                } catch (error) {
                                                                    console.error(error);
                                                                }
                                                            } else if (e.key === 'Escape') {
                                                                setIsCreatingCategory(false);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCreatingCategory(false)}
                                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreatingCategory(true)}
                                                    className="px-4 py-2 rounded-xl border border-dashed border-white/10 text-white/20 text-sm hover:text-white/60 hover:border-white/20 transition-colors whitespace-nowrap"
                                                >
                                                    + Nueva
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row: Wallet & Date */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 relative z-30">
                                            <label className="text-xs font-bold text-white/40 uppercase ml-1">Billetera</label>
                                            {/* Custom Wallet Dropdown */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsWalletSelectorOpen(!isWalletSelectorOpen)}
                                                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl py-3 md:py-2.5 px-3 text-sm text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        {currentWalletObj ? (
                                                            <>
                                                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: currentWalletObj.color }} />
                                                                <div className="flex flex-col items-start leading-none gap-0.5">
                                                                    <span className="font-bold truncate max-w-[200px] md:max-w-[90px]">{currentWalletObj.name}</span>
                                                                    <span className="text-[10px] text-white/50">{formatCurrency(currentWalletObj.balance || 0)}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="text-white/40">Seleccionar...</span>
                                                        )}
                                                    </div>
                                                    <ArrowDownRight className={`w-4 h-4 text-white/40 transition-transform ${isWalletSelectorOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Dropdown Options */}
                                                <AnimatePresence>
                                                    {isWalletSelectorOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-[#1a2235] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1 z-50"
                                                        >
                                                            {activeWallets.map(w => (
                                                                <button
                                                                    key={w.id}
                                                                    type="button"
                                                                    onClick={() => { setSelectedWallet(w.id); setIsWalletSelectorOpen(false); }}
                                                                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${selectedWallet === w.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                                                                        <span className="text-sm font-medium text-white">{w.name}</span>
                                                                    </div>
                                                                    <span className="text-xs text-white/60 font-mono">{formatCurrency(w.balance || 0)}</span>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <div className="space-y-1 relative z-20">
                                            <label className="text-xs font-bold text-white/40 uppercase ml-1">Fecha</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3.5 md:top-3 w-4 h-4 text-white/40" />
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={e => setDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 md:py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
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
