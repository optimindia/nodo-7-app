import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Coins } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Components
import GoalCard3D from '../../components/goals/GoalCard3D';
import GoalsHero from '../../components/goals/GoalsHero';

const CreateGoalModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
        icon: 'target',
        image_url: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                title: '',
                target_amount: '',
                current_amount: '',
                deadline: '',
                icon: 'target',
                image_url: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 shadow-2xl z-10"
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">{initialData ? 'Editar Meta' : 'Nueva Meta'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Nombre</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej. Tesla Model 3"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-2">Objetivo ($)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-2">Ahorrado ($)</label>
                                <input
                                    type="number"
                                    value={formData.current_amount}
                                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Fecha Límite</label>
                            <input
                                type="date"
                                required
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors scheme-dark"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase mb-2">URL Imagen (Opcional)</label>
                            <input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        {initialData && (
                            <button
                                type="button"
                                onClick={() => onSave(formData, true)}
                                className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform"
                        >
                            {initialData ? 'Guardar Cambios' : 'Crear Meta'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const QuickAddModal = ({ isOpen, onClose, onSave, goal }) => {
    const [amount, setAmount] = useState('');

    if (!isOpen || !goal) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(goal.id, parseFloat(amount));
        setAmount('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2rem] p-6 shadow-2xl z-10"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
                        <Coins className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">¡Impulso Rápido!</h2>
                    <p className="text-white/60 text-sm">Añadir fondos a "{goal.title}"</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="number"
                        autoFocus
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />

                    <button
                        type="submit"
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        Confirmar Depósito
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

const Goals = () => {
    const { session } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [quickAddGoal, setQuickAddGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);

    useEffect(() => {
        if (session) fetchGoals();
    }, [session]);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('deadline', { ascending: true }); // Sort by deadline urgency

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoal = async (formData, isDelete = false) => {
        try {
            if (isDelete && editingGoal) {
                const { error } = await supabase.from('goals').delete().eq('id', editingGoal.id);
                if (error) throw error;
            } else if (editingGoal) {
                const { error } = await supabase.from('goals').update({
                    title: formData.title,
                    target_amount: parseFloat(formData.target_amount),
                    current_amount: parseFloat(formData.current_amount || 0),
                    deadline: formData.deadline,
                    icon: formData.icon,
                    image_url: formData.image_url
                }).eq('id', editingGoal.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('goals').insert([{
                    user_id: session.user.id,
                    title: formData.title,
                    target_amount: parseFloat(formData.target_amount),
                    current_amount: parseFloat(formData.current_amount || 0),
                    deadline: formData.deadline,
                    icon: formData.icon,
                    image_url: formData.image_url
                }]);
                if (error) throw error;
            }
            fetchGoals();
            setIsModalOpen(false);
            setEditingGoal(null);
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    };

    const handleQuickAdd = async (goalId, amount) => {
        try {
            // Optimistic Update
            const goal = goals.find(g => g.id === goalId);
            const newAmount = (Number(goal.current_amount) || 0) + amount;

            const { error } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', goalId);

            if (error) throw error;
            fetchGoals();
        } catch (error) {
            console.error('Error quick adding:', error);
            alert('Falló el depósito rápido');
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Header with New Button (Float or Fixed) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Metas & Sueños</h1>
                <button
                    onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Crear Nueva Meta
                </button>
            </div>

            <GoalsHero goals={goals} />

            {loading ? (
                <div className="text-center py-20 text-white/40 animate-pulse">Cargando tablero...</div>
            ) : goals.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem] bg-white/5">
                    <p className="text-white/60 mb-6 text-lg">Tu tablero de sueños está vacío.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-bold shadow-lg"
                    >
                        Comenzar Ahora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence mode='popLayout'>
                        {goals.map((goal) => (
                            <GoalCard3D
                                key={goal.id}
                                goal={goal}
                                onEdit={(g) => { setEditingGoal(g); setIsModalOpen(true); }}
                                onQuickAdd={(g) => { setQuickAddGoal(g); setIsQuickAddOpen(true); }}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <CreateGoalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveGoal}
                initialData={editingGoal}
            />

            <QuickAddModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onSave={handleQuickAdd}
                goal={quickAddGoal}
            />
        </div>
    );
};

export default Goals;
