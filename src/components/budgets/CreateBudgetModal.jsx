import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

const CreateBudgetModal = ({ isOpen, onClose, onCreate }) => {
    const { categories } = useCategories();
    // Only show Expense categories for budgeting
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Format Amount Input
    const handleAmountChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val) {
            setAmount(Number(val).toLocaleString('es-AR'));
        } else {
            setAmount('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category || !amount) return;

        setLoading(true);
        // Parse "1.000" back to 1000
        const numericAmount = parseFloat(amount.replace(/\./g, ''));

        try {
            await onCreate({ category, amount: numericAmount, period: 'monthly' });
            onClose();
            // Reset form
            setCategory('');
            setAmount('');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-[#1a2235] border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
                    >
                        <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-white/5 rounded-full text-white/40 hover:text-white">
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
                                <Target className="text-indigo-400" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Nuevo Presupuesto</h2>
                            <p className="text-white/40 text-sm">Define un límite mensual para controlar tus gastos.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Category Selector */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase ml-1 block mb-2">Categoría</label>
                                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {expenseCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.name)}
                                            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${category === cat.name
                                                    ? `bg-${cat.color || 'indigo'}-500/20 border-${cat.color || 'indigo'}-500 text-white`
                                                    : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="truncate w-full text-center">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase ml-1 block mb-2">Límite Mensual</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-xl font-bold text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !category || !amount}
                                className="w-full py-4 mt-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Creando...' : 'Crear Presupuesto'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateBudgetModal;
