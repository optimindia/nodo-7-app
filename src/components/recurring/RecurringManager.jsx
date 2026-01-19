import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Calendar, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const RecurringManager = ({ wallets }) => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        description: '',
        category: 'Suscripciones',
        wallet_id: '',
        frequency: 'monthly',
        next_due_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (user) fetchTemplates();
    }, [user]);

    const fetchTemplates = async () => {
        const { data } = await supabase
            .from('recurring_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('next_due_date', { ascending: true });
        if (data) setTemplates(data);
    };

    const handleSave = async () => {
        if (!formData.amount || !formData.wallet_id) return;

        const { data, error } = await supabase
            .from('recurring_templates')
            .insert([{ ...formData, user_id: user.id }])
            .select();

        if (data) {
            setTemplates([...templates, ...data]);
            setShowForm(false);
            setFormData({ ...formData, description: '', amount: '' });
        }
    };

    const handleDelete = async (id) => {
        setTemplates(templates.filter(t => t.id !== id));
        await supabase.from('recurring_templates').delete().eq('id', id);
    };

    return (
        <div className="bg-[#0f172a] rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                        <RefreshCcw className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Pagos Recurrentes</h3>
                        <p className="text-white/40 text-sm">Gestiona suscripciones e ingresos fijos</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`p-2 rounded-lg transition-colors ${showForm ? 'bg-white/10 text-white' : 'text-cyan-400 hover:bg-cyan-500/10'}`}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-6 border-b border-white/10 bg-white/[0.02]"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl p-3 text-white"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="expense">Gasto Recurrente</option>
                            <option value="income">Ingreso Recurrente</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Descripción (ej: Netflix)"
                            className="bg-black/40 border border-white/10 rounded-xl p-3 text-white"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-white/40">$</span>
                            <input
                                type="number"
                                placeholder="Monto"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-8 text-white"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl p-3 text-white"
                            value={formData.wallet_id}
                            onChange={e => setFormData({ ...formData, wallet_id: e.target.value })}
                        >
                            <option value="">Seleccionar Billetera</option>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <input
                            type="date"
                            className="bg-black/40 border border-white/10 rounded-xl p-3 text-white"
                            value={formData.next_due_date}
                            onChange={e => setFormData({ ...formData, next_due_date: e.target.value })}
                        />
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl p-3 text-white"
                            value={formData.frequency}
                            onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                        >
                            <option value="monthly">Mensual</option>
                            <option value="weekly">Semanal</option>
                            <option value="yearly">Anual</option>
                        </select>
                    </div>
                    <button onClick={handleSave} className="w-full btn-primary py-3">Guardar Recurrencia</button>
                </motion.div>
            )}

            {/* List */}
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {templates.length === 0 ? (
                    <p className="text-center text-white/30 py-4 text-sm">No hay pagos recurrentes configurados.</p>
                ) : (
                    templates.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group border border-transparent hover:border-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{t.description}</h4>
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <Calendar className="w-3 h-3" />
                                        <span>Próx: {new Date(t.next_due_date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="capitalize">{t.frequency}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${Number(t.amount).toLocaleString()}
                                </span>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecurringManager;
