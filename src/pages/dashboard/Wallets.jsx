import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, CreditCard, Landmark, Banknote, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import RecurringManager from '../../components/recurring/RecurringManager';

const Wallets = () => {
    const { user } = useAuth();
    const { formatCurrency, transactions } = useDashboardData(); // Assuming we update hook to expose refresh

    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit State
    const [editingWallet, setEditingWallet] = useState(null);

    // Form inputs
    const [name, setName] = useState('');
    const [type, setType] = useState('general');
    const [initialBalance, setInitialBalance] = useState(''); // New State
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) fetchWallets();
    }, [user, transactions]); // Re-fetch/calculate when transactions change

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Calculate balances locally
            const walletsWithBalance = data.map(w => {
                const walletTx = transactions.filter(tx => tx.wallet_id === w.id);
                const txBalance = walletTx.reduce((acc, tx) => {
                    const amt = Number(tx.amount);
                    if (tx.type === 'deposit' || tx.type === 'yield') return acc + amt;
                    if (tx.type === 'withdrawal' || tx.type === 'payment') return acc - amt;
                    return acc;
                }, 0);
                // Add initial_balance to transaction balance
                return { ...w, balance: (Number(w.initial_balance) || 0) + txBalance };
            });

            setWallets(walletsWithBalance);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWallet = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingWallet) {
                // Update
                const { error } = await supabase
                    .from('wallets')
                    .update({
                        name,
                        type,
                        initial_balance: parseFloat(initialBalance || 0),
                        color: getColorByType(type)
                    })
                    .eq('id', editingWallet.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('wallets')
                    .insert([{
                        user_id: user.id,
                        name,
                        type,
                        initial_balance: parseFloat(initialBalance || 0),
                        color: getColorByType(type)
                    }]);
                if (error) throw error;
            }

            fetchWallets();
            closeModal();
        } catch (error) {
            console.error('Error saving wallet:', error);
            alert('Error al guardar billetera: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingWallet) return;
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta billetera? Las transacciones asociadas podrían quedar huérfanas.')) return;

        try {
            setSubmitting(true);
            const { error } = await supabase
                .from('wallets')
                .delete()
                .eq('id', editingWallet.id);
            if (error) throw error;
            fetchWallets();
            closeModal();
        } catch (error) {
            console.error('Error deleting wallet:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setEditingWallet(null);
        setName('');
        setType('general');
        setInitialBalance('');
        setIsModalOpen(true);
    };

    const openEditModal = (wallet) => {
        setEditingWallet(wallet);
        setName(wallet.name);
        setType(wallet.type);
        setInitialBalance(wallet.initial_balance || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingWallet(null);
    };

    const getColorByType = (type) => {
        if (type === 'bank') return 'purple';
        if (type === 'crypto') return 'cyan';
        if (type === 'cash') return 'green';
        return 'blue';
    };

    const getIconByType = (type) => {
        if (type === 'bank') return Landmark;
        if (type === 'crypto') return Wallet;
        if (type === 'cash') return Banknote;
        return CreditCard;
    };

    const WalletCard = ({ wallet }) => {
        const Icon = getIconByType(wallet.type);
        const colorClass =
            wallet.color === 'purple' ? 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30' :
                wallet.color === 'cyan' ? 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30' :
                    wallet.color === 'green' ? 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30' :
                        'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';

        return (
            <motion.div
                whileHover={{ y: -5 }}
                className={`p-6 rounded-3xl border backdrop-blur-md bg-gradient-to-br ${colorClass} min-h-[180px] flex flex-col justify-between relative overflow-hidden group`}
            >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-10 translate-x-10 bg-current opacity-20`} />

                <div className="flex justify-between items-start relative z-10">
                    <div className="p-3 rounded-2xl bg-black/20 text-inherit">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(wallet)} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-white/60 font-medium mb-1">{wallet.name}</h3>
                    <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(wallet.balance || 0)}</p>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mis Billeteras</h1>
                    <p className="text-white/40 text-sm">Gestiona tus fuentes de fondos</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Billetera
                </button>
            </div>

            {/* Recurring Transactions Manager */}
            <RecurringManager wallets={wallets} />

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400 w-8 h-8" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map(wallet => (
                        <WalletCard key={wallet.id} wallet={wallet} />
                    ))}

                    {/* Empty State Action */}
                    {wallets.length === 0 && (
                        <div onClick={openCreateModal} className="col-span-full py-20 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
                            <Plus className="w-12 h-12 mb-4 opacity-50" />
                            <p>No tienes billeteras. ¡Crea la primera!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Wallet Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-[#030712] border border-white/20 rounded-3xl p-8 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingWallet ? 'Editar Billetera' : 'Crear Billetera'}</h3>
                                <button onClick={closeModal} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSaveWallet} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Nombre</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Ej: Ahorros, Binance, Banco X"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Saldo Inicial (Base)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={initialBalance}
                                            onChange={e => setInitialBalance(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-white/30">Monto base de la cuenta, sin contar transacciones.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Tipo</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['general', 'cash', 'bank', 'crypto'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`py-2 rounded-lg text-sm font-medium capitalize border ${type === t
                                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                    : 'border-white/10 text-white/40 hover:bg-white/5'
                                                    }`}
                                            >
                                                {t === 'general' ? 'General' : t === 'cash' ? 'Efectivo' : t === 'bank' ? 'Banco' : 'Cripto'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    {editingWallet && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={submitting}
                                            className="px-4 py-3 bg-red-500/10 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={submitting || !name}
                                        className="flex-1 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingWallet ? 'Guardar Cambios' : 'Crear Billetera')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Wallets;
