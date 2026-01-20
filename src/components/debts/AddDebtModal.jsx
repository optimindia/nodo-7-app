import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Save, DollarSign, Percent, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddDebtModal = ({ isOpen, onClose, onDebtAdded, userId }) => {
    const [formData, setFormData] = useState({
        name: '',
        current_balance: '',
        interest_rate: '',
        min_payment: '',
        due_date: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const parseArgentine = (val) => {
                if (!val) return 0;
                if (typeof val === 'number') return val;
                return parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
            };

            const currentBalance = parseArgentine(formData.current_balance);
            const minPayment = parseArgentine(formData.min_payment);

            const { error } = await supabase.from('debts').insert([{
                user_id: userId,
                name: formData.name,
                total_amount: currentBalance, // Initially, total = current
                current_balance: currentBalance,
                interest_rate: formData.interest_rate || 0,
                min_payment: minPayment || 0,
                due_date: formData.due_date || null
            }]);

            if (error) throw error;

            onDebtAdded();
            onClose();
            setFormData({ name: '', current_balance: '', interest_rate: '', min_payment: '', due_date: '' });
        } catch (error) {
            console.error('Error adding debt:', error);
            alert('Error al agregar la deuda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                            <span className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                <DollarSign className="w-5 h-5" />
                            </span>
                            Nueva Deuda
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Nombre de la Deuda</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Tarjeta Visa, Préstamo Auto"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Saldo Actual</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-9 text-white focus:border-red-500 outline-none transition-colors"
                                            value={formData.current_balance}
                                            onChange={e => {
                                                let val = e.target.value.replace(/[^0-9,]/g, '');
                                                const parts = val.split(',');
                                                const integerPart = parts[0].replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                const finalVal = parts.length > 1 ? `${integerPart},${parts[1].slice(0, 2)}` : (val.includes(',') ? `${integerPart},` : integerPart);
                                                setFormData({ ...formData, current_balance: finalVal });
                                            }}
                                            inputMode="decimal"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Pago Mínimo</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-9 text-white focus:border-red-500 outline-none transition-colors"
                                            value={formData.min_payment}
                                            onChange={e => {
                                                let val = e.target.value.replace(/[^0-9,]/g, '');
                                                const parts = val.split(',');
                                                const integerPart = parts[0].replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                const finalVal = parts.length > 1 ? `${integerPart},${parts[1].slice(0, 2)}` : (val.includes(',') ? `${integerPart},` : integerPart);
                                                setFormData({ ...formData, min_payment: finalVal });
                                            }}
                                            inputMode="decimal"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Interés Anual (%)</label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-9 text-white focus:border-red-500 outline-none transition-colors"
                                            value={formData.interest_rate}
                                            onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Fecha Vencimiento</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="date"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-9 text-white focus:border-red-500 outline-none transition-colors [color-scheme:dark]"
                                            value={formData.due_date}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar Deuda</>}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddDebtModal;
