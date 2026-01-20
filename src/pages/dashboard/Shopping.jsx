import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Check, Trash2, Calendar, DollarSign, Wallet, MoreVertical, X, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/format';

const Shopping = ({ wallets }) => {
    const { user } = useAuth();
    const [lists, setLists] = useState([]);
    const [activeList, setActiveList] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [finalizeDetails, setFinalizeDetails] = useState({ amount: '', wallet_id: '' });
    const [deletingListId, setDeletingListId] = useState(null);

    // Fetch Lists
    useEffect(() => {
        fetchLists();
    }, [user]);

    const fetchLists = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('shopping_lists')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        if (data) setLists(data);
        setLoading(false);
    };

    // Fetch Items
    const fetchItems = async (listId) => {
        const { data } = await supabase
            .from('shopping_items')
            .select('*')
            .eq('list_id', listId)
            .order('created_at', { ascending: true });
        setItems(data || []);
    };

    const handleCreateList = async () => {
        if (!newListTitle.trim()) return;
        try {
            const { data, error } = await supabase
                .from('shopping_lists')
                .insert([{ user_id: user.id, name: newListTitle, status: 'active' }])
                .select()
                .single();

            if (data) {
                setLists([data, ...lists]);
                setNewListTitle('');
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteList = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("¿Eliminar esta lista permanentemente?")) return;

        setDeletingListId(id);
        setTimeout(async () => {
            await supabase.from('shopping_lists').delete().eq('id', id);
            setLists(lists.filter(l => l.id !== id));
            setDeletingListId(null);
        }, 300);
    };

    // --- Items Logic ---
    const handleAddItem = async (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const name = e.target.value.trim();
            const { data } = await supabase
                .from('shopping_items')
                .insert([{ list_id: activeList.id, name }])
                .select()
                .single();
            if (data) setItems([...items, data]);
            e.target.value = '';
        }
    };

    const toggleItem = async (id, currentStatus) => {
        setItems(items.map(i => i.id === id ? { ...i, is_checked: !currentStatus } : i));
        await supabase.from('shopping_items').update({ is_checked: !currentStatus }).eq('id', id);
    };

    const deleteItem = async (id) => {
        setItems(items.filter(i => i.id !== id));
        await supabase.from('shopping_items').delete().eq('id', id);
    };

    // --- Finalize Logic ---
    // Auto-select first wallet and reset if needed
    useEffect(() => {
        if (showFinalizeModal) {
            setFinalizeDetails(prev => ({
                ...prev,
                amount: '',
                wallet_id: prev.wallet_id || (wallets.length > 0 ? wallets[0].id : '')
            }));
        }
    }, [showFinalizeModal]);

    // --- Finalize Logic ---
    const handleFinalizeShop = async () => {
        if (!finalizeDetails.amount || !finalizeDetails.wallet_id) {
            alert("Por favor ingresa el monto y selecciona una billetera.");
            return;
        }

        try {
            const parseArgentine = (val) => {
                if (!val) return 0;
                if (typeof val === 'number') return val;
                return parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
            };
            const amount = parseArgentine(finalizeDetails.amount);
            if (isNaN(amount) || amount <= 0) {
                alert("El monto debe ser válido.");
                return;
            }

            // 1. Create Transaction
            const { error: txError } = await supabase.from('transactions').insert([{
                user_id: user.id,
                wallet_id: finalizeDetails.wallet_id,
                amount: amount,
                type: 'withdrawal', // Ensure this matches check constraint in DB
                category: 'Shopping',
                description: `Compra: ${activeList.name}`,
                date: new Date().toISOString()
            }]);

            if (txError) throw txError;

            // 2. Mark List as Completed
            const { error: listError } = await supabase.from('shopping_lists')
                .update({ status: 'completed', total_spent: amount })
                .eq('id', activeList.id);

            if (listError) throw listError;

            // 3. Cleanup
            setLists(lists.filter(l => l.id !== activeList.id));
            setActiveList(null);
            setShowFinalizeModal(false);
            setFinalizeDetails({ amount: '', wallet_id: '' });

            // Optional: Show success feedback?

        } catch (error) {
            console.error(error);
            alert(`Error al finalizar: ${error.message || error.details || 'Intenta de nuevo'}`);
        }
    };

    const progress = activeList && items.length > 0
        ? Math.round((items.filter(i => i.is_checked).length / items.length) * 100)
        : 0;

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Listas de Compras</h1>
                    <p className="text-white/60">Gestiona tus gastos antes de hacerlos.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Lista</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative min-h-[500px]">

                {/* LISTS GRID */}
                <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-20">
                    {lists.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 mt-10">
                            <ShoppingCart className="w-12 h-12 text-white/20 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Tu carrito está vacío</h3>
                            <p className="text-white/40">Crea una lista para organizar tus compras.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lists.map(list => (
                                <motion.div
                                    layout
                                    key={list.id}
                                    onClick={() => { setActiveList(list); fetchItems(list.id); }}
                                    className="relative p-6 rounded-3xl bg-[#1e293b] border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all hover:shadow-lg group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-cyan-500/20 transition-colors" />

                                    <div className="flex justify-between items-start mb-12 relative z-10">
                                        <div className="p-3 rounded-2xl bg-white/5 text-cyan-400 border border-white/5">
                                            <ShoppingCart className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteList(e, list.id)}
                                            className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold text-white mb-1 truncate">{list.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(list.created_at).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                            <span className="text-emerald-400 font-medium">ACTIVA</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MODAL: CREATE LIST */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-sm bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-2xl"
                            >
                                <h2 className="text-xl font-bold text-white mb-4">Nueva Lista</h2>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500 mb-6"
                                    placeholder="Ej: Supermercado"
                                    value={newListTitle}
                                    onChange={e => setNewListTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl">Cancelar</button>
                                    <button onClick={handleCreateList} className="flex-1 py-3 bg-cyan-500 text-black font-bold rounded-xl">Crear</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- FULL SCREEN OVERLAY: ACTIVE LIST DETAIL --- */}
            <AnimatePresence>
                {activeList && (
                    <motion.div
                        initial={{ x: '100%' }} // Slide from right for better context
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 z-[100] bg-[#030712] flex flex-col items-center justify-center p-4 md:p-8"
                    >
                        {/* Container Card */}
                        <div className="w-full max-w-4xl h-full bg-[#0f172a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">

                            {/* Header */}
                            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md z-20">
                                <button
                                    onClick={() => setActiveList(null)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all group"
                                >
                                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    <span>Volver</span>
                                </button>
                                <h2 className="text-2xl font-black text-white text-center absolute left-1/2 -translate-x-1/2 w-full max-w-[200px] truncate">
                                    {activeList.name}
                                </h2>
                                <div className="w-[88px]" /> {/* Spacer for centering */}
                            </div>

                            {/* Progress Bar (Sticky) */}
                            <div className="h-1.5 w-full bg-black/40 relative z-20">
                                <motion.div
                                    className="h-full bg-cyan-500 shadow-[0_0_15px_#22d3ee]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Content Scroll Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative z-10 bg-[#0f172a]">
                                <div className="max-w-2xl mx-auto space-y-8">

                                    {/* Add Item Input */}
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-lg text-white/40 group-focus-within:text-cyan-400 group-focus-within:bg-cyan-500/10 transition-all">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Añadir item a la lista... (Enter)"
                                            className="w-full bg-[#1e293b] border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-lg text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 focus:bg-[#253045] shadow-lg transition-all"
                                            onKeyDown={handleAddItem}
                                        />
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-3">
                                        <AnimatePresence mode='popLayout'>
                                            {items.map(item => (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, x: -10 }}
                                                    key={item.id}
                                                    className={`group relative flex items-center gap-5 p-4 rounded-2xl border transition-all duration-300 ${item.is_checked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white-[0.07]'}`}
                                                >
                                                    <button
                                                        onClick={() => toggleItem(item.id, item.is_checked)}
                                                        className={`shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${item.is_checked ? 'bg-emerald-500 border-emerald-500 rotate-0' : 'border-white/20 hover:border-cyan-400 rotate-0'}`}
                                                    >
                                                        {item.is_checked && <Check className="w-5 h-5 text-black stroke-[3px]" />}
                                                    </button>

                                                    <span className={`flex-1 text-lg font-medium transition-colors ${item.is_checked ? 'text-white/30 line-through decoration-2 decoration-white/20' : 'text-white'}`}>
                                                        {item.name}
                                                    </span>

                                                    <button
                                                        onClick={() => deleteItem(item.id)}
                                                        className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {items.length === 0 && (
                                            <div className="text-center py-24 flex flex-col items-center justify-center text-white/20">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <ShoppingCart className="w-8 h-8 opacity-50" />
                                                </div>
                                                <p className="text-lg font-medium">Lista vacía</p>
                                                <p className="text-sm">Escribe arriba para añadir items rápidamente.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Finalize */}
                            <div className="p-6 md:p-8 border-t border-white/10 bg-[#0f172a] z-20">
                                <div className="max-w-2xl mx-auto flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Items Completados</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-white">{items.filter(i => i.is_checked).length}</span>
                                            <span className="text-lg text-white/40 font-medium">/ {items.length}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowFinalizeModal(true)}
                                        disabled={items.length === 0}
                                        className="py-4 px-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-base flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Wallet className="w-6 h-6" />
                                        <span>Finalizar Compra</span>
                                    </button>
                                </div>
                            </div>

                            {/* FINALIZE MODAL (Nested) */}
                            <AnimatePresence>
                                {showFinalizeModal && (
                                    <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.95, opacity: 0 }}
                                            className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                                        >
                                            {/* Glow */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/20 blur-[60px]" />

                                            <div className="relative z-10 text-center mb-6">
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-black text-white">Confirmar Gasto</h3>
                                                <p className="text-white/50 text-xs mt-1">Ingresa el total real gastado.</p>
                                            </div>

                                            <div className="space-y-6 relative z-10">
                                                {/* Amount Input */}
                                                <div className="flex flex-col items-center">
                                                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 opacity-80">Monto Final</label>
                                                    <div className="relative w-full max-w-[200px] group">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors">$</span>
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            className="w-full bg-[#030712] border border-emerald-500/20 rounded-2xl py-3 pl-10 pr-4 text-3xl font-bold text-white text-center focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all placeholder:text-white/5"
                                                            placeholder="0,00"
                                                            value={finalizeDetails.amount}
                                                            onChange={e => {
                                                                let val = e.target.value.replace(/[^0-9,]/g, '');
                                                                const parts = val.split(',');
                                                                const integerPart = parts[0].replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                                const finalVal = parts.length > 1 ? `${integerPart},${parts[1].slice(0, 2)}` : (val.includes(',') ? `${integerPart},` : integerPart);
                                                                setFinalizeDetails({ ...finalizeDetails, amount: finalVal });
                                                            }}
                                                            inputMode="decimal"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Wallet Selection */}
                                                <div className="pt-1">
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Pagar desde</label>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                                        {wallets?.map(w => (
                                                            <button
                                                                key={w.id}
                                                                onClick={() => setFinalizeDetails({ ...finalizeDetails, wallet_id: w.id })}
                                                                className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group overflow-hidden ${finalizeDetails.wallet_id === w.id ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                                            >
                                                                {/* Active Indicator */}
                                                                {finalizeDetails.wallet_id === w.id && (
                                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                                                                )}

                                                                <div className="flex items-center gap-2 pl-2">
                                                                    <div className={`p-1.5 rounded-md transition-colors ${finalizeDetails.wallet_id === w.id ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40 group-hover:text-white'}`}>
                                                                        <Wallet className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <span className={`font-bold text-xs text-left ${finalizeDetails.wallet_id === w.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{w.name}</span>
                                                                </div>
                                                                <span className={`text-xs font-mono font-bold tracking-tight ${finalizeDetails.wallet_id === w.id ? 'text-emerald-400' : 'text-white/40'}`}>
                                                                    {formatCurrency(w.balance || 0)}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-6 relative z-10">
                                                <button
                                                    onClick={() => setShowFinalizeModal(false)}
                                                    className="flex-1 py-3 rounded-xl font-bold text-xs text-white/40 hover:text-white bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleFinalizeShop}
                                                    disabled={!finalizeDetails.amount || !finalizeDetails.wallet_id}
                                                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transform hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    Confirmar
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Shopping;
