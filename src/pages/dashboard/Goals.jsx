import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Car, Plane, Home, Smartphone, Gift, X, Sparkles, TrendingUp, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const icons = {
    car: Car,
    travel: Plane,
    house: Home,
    tech: Smartphone,
    other: Gift,
    target: Target
};

const presetImages = {
    car: "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=2070&auto=format&fit=crop",
    travel: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
    house: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2565&auto=format&fit=crop",
    tech: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
    wealth: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop"
};

const GoalCard = ({ goal, onEdit, onDelete }) => {
    const Icon = icons[goal.icon] || Target;
    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const bgImage = goal.image_url || presetImages[goal.icon] || presetImages.wealth;

    return (
        <motion.div
            layout
            whileHover={{ y: -5 }}
            className="group relative h-[300px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
        >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
                <img src={bgImage} alt={goal.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Content using Flex Column to push content to bottom */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                {/* Top Action Bar */}
                <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-xs font-bold text-white/80 bg-black/40 backdrop-blur-md py-1 px-3 rounded-full border border-white/10">
                        {goal.deadline}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(goal)} className="p-2 rounded-full bg-black/40 hover:bg-white/20 text-white transition-colors backdrop-blur-md">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Bottom Stats */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10`}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">{goal.title}</h3>
                            <p className="text-white/60 text-xs">Meta: ${goal.target_amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-white text-lg">${goal.current_amount.toLocaleString()}</span>
                            <span className="font-bold text-cyan-400">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

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
                className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h2 className="text-2xl font-bold text-white">{initialData ? 'Editar Meta' : 'Nueva Meta'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
                                    placeholder="50000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-2">Ahorrado ($)</label>
                                <input
                                    type="number"
                                    value={formData.current_amount}
                                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Fecha Límite</label>
                            <input
                                type="text"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                placeholder="Ej. Dic 2026"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase mb-2">URL de Imagen (Opcional)</label>
                            <input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase mb-2">Icono</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {Object.keys(icons).map((key) => {
                                    const IconComp = icons[key];
                                    return (
                                        <button
                                            type="button"
                                            key={key}
                                            onClick={() => setFormData({ ...formData, icon: key })}
                                            className={`p-3 rounded-xl border shrink-0 transition-all ${formData.icon === key ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 scale-110' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                        >
                                            <IconComp className="w-5 h-5" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        {initialData && (
                            <button
                                type="button"
                                onClick={() => onSave(formData, true)} // true indicates delete
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

const Goals = () => {
    const { session } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);

    useEffect(() => {
        fetchGoals();
    }, [session]);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: false });

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
                const { error } = await supabase
                    .from('goals')
                    .delete()
                    .eq('id', editingGoal.id);
                if (error) throw error;
            } else if (editingGoal) {
                const { error } = await supabase
                    .from('goals')
                    .update({
                        title: formData.title,
                        target_amount: parseFloat(formData.target_amount),
                        current_amount: parseFloat(formData.current_amount || 0),
                        deadline: formData.deadline,
                        icon: formData.icon,
                        image_url: formData.image_url
                    })
                    .eq('id', editingGoal.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('goals')
                    .insert([{
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
            alert('Error al guardar la meta');
        }
    };

    const openEditModal = (goal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingGoal(null);
        setIsModalOpen(true);
    };

    // Calculate Summary Stats
    const totalSavings = goals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0);
    const totalTarget = goals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0);
    const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Metas Financieras</h1>
                    <p className="text-white/40 text-lg">Visualiza, planifica y conquista tus sueños.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Meta
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-white/10 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Ahorro Total</p>
                        <h2 className="text-4xl font-bold text-white mb-2">${totalSavings.toLocaleString()}</h2>
                        <p className="text-white/40 text-xs">de ${totalTarget.toLocaleString()} objetivo total</p>
                    </div>
                    <Target className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-indigo-500/10 group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="p-8 rounded-[2rem] bg-black/20 border border-white/10 backdrop-blur-xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">En Progreso</p>
                            <h2 className="text-4xl font-bold text-white">{goals.length - completedGoals}</h2>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <TrendingUp className="w-6 h-6 text-cyan-400" />
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-black/20 border border-white/10 backdrop-blur-xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Completadas</p>
                            <h2 className="text-4xl font-bold text-emerald-400">{completedGoals}</h2>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <Sparkles className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            {loading ? (
                <div className="text-center py-20 text-white/40">Cargando tus sueños...</div>
            ) : goals.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-[2rem] bg-white/5">
                    <p className="text-white/60 mb-4">No tienes metas activas aún.</p>
                    <button onClick={openCreateModal} className="text-cyan-400 font-bold hover:underline">Crear mi primera meta</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {goals.map((goal) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onEdit={openEditModal}
                                onDelete={() => handleSaveGoal(null, true)} // Pass a function or handle differently in card
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <CreateGoalModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveGoal}
                        initialData={editingGoal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Goals;
