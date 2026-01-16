import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, Trash2, Edit2, X, Download, ShieldCheck, Smile } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

const EmojiPicker = ({ onSelect }) => {
    const emojis = [
        '💰', '💸', '💳', '🏦', '💎', // Money
        '🍔', '🍕', '☕', '🛒', '🍎', // Food
        '🏠', '💡', '🚿', '🛋️', '🔒', // Home
        '🚗', '✈️', '🚌', '⛽', '🗺️', // Transport
        '🎬', '🎮', '🎵', '📺', '🎉', // Fun
        '🏥', '💊', '💪', '🧘', '⚕️', // Health
        '🎓', '📚', '💼', '💻', '📱', // Work/Edu
        '🛍️', '🎁', '👕', '🐶', '👶'  // Shopping/Family
    ];

    return (
        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-black/40 rounded-xl border border-white/10 custom-scrollbar">
            {emojis.map(emoji => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="text-xl p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

const Categories = () => {
    const { categories, loading, addCategory, updateCategory, deleteCategory, seedDefaults } = useCategories();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState(null);

    // Form
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [icon, setIcon] = useState('🏷️');
    const [color, setColor] = useState('blue');

    const openCreate = () => {
        setEditingCat(null);
        setName('');
        setType('expense');
        setIcon('🏷️');
        setColor('blue');
        setIsModalOpen(true);
    };

    const openEdit = (cat) => {
        setEditingCat(cat);
        setName(cat.name);
        setType(cat.type);
        setIcon(cat.icon || '🏷️');
        setColor(cat.color || 'blue');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCat) {
                await updateCategory(editingCat.id, { name, type, icon, color });
            } else {
                await addCategory({ name, type, icon, color });
            }
            setIsModalOpen(false);
        } catch (error) {
            alert('Error saving category');
        }
    };

    const handleDelete = async () => {
        if (confirm('Eliminar esta categoría?')) {
            await deleteCategory(editingCat.id);
            setIsModalOpen(false);
        }
    };

    const colors = ['blue', 'cyan', 'purple', 'pink', 'red', 'orange', 'yellow', 'green'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Categorías</h1>
                    <p className="text-white/40">Organiza tus finanzas con tu propio estilo.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Categoría
                </button>
            </div>

            {/* Empty State / Defaults */}
            {!loading && categories.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-white/5 text-center">
                    <ShieldCheck className="w-16 h-16 text-cyan-500/50 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Comienza Rápido</h3>
                    <p className="text-white/40 max-w-md mb-6">Parece que aún no tienes categorías. Podemos instalar un pack básico (Casa, Comida, Transporte) para que empieces ya.</p>
                    <button
                        onClick={() => seedDefaults()}
                        className="px-6 py-3 bg-white/10 border border-white/10 hover:bg-white/20 rounded-xl text-white font-bold flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Instalar Pack Básico
                    </button>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Expenses Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span> Gastos
                    </h3>
                    {categories.filter(c => c.type === 'expense').map(cat => (
                        <motion.div
                            key={cat.id}
                            whileHover={{ x: 5 }}
                            onClick={() => openEdit(cat)}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg bg-${cat.color}-500/20 flex items-center justify-center text-xl`}>
                                    {cat.icon}
                                </div>
                                <span className="font-bold text-white">{cat.name}</span>
                            </div>
                            <Edit2 className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                        </motion.div>
                    ))}
                </div>

                {/* Income Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ingresos
                    </h3>
                    {categories.filter(c => c.type === 'income').map(cat => (
                        <motion.div
                            key={cat.id}
                            whileHover={{ x: 5 }}
                            onClick={() => openEdit(cat)}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg bg-${cat.color}-500/20 flex items-center justify-center text-xl`}>
                                    {cat.icon}
                                </div>
                                <span className="font-bold text-white">{cat.name}</span>
                            </div>
                            <Edit2 className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm bg-[#0f172a] border border-white/20 rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingCat ? 'Editar' : 'Crear'} Categoría</h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase">Nombre</label>
                                    <input
                                        value={name} onChange={e => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white mt-1 focus:border-cyan-500/50 outline-none"
                                        placeholder="Ej. Videojuegos"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase">Tipo</label>
                                    <div className="flex gap-2 mt-1">
                                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg text-sm border ${type === 'expense' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'border-white/10 text-white/40'}`}>Gasto</button>
                                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg text-sm border ${type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-white/40'}`}>Ingreso</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Icono (Emoji)</label>
                                    <div className="flex gap-2 items-center mb-2">
                                        <span className="text-3xl">{icon}</span>
                                        <span className="text-white/40 text-xs">Selecciona uno abajo</span>
                                    </div>
                                    <EmojiPicker onSelect={setIcon} />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colors.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-6 h-6 rounded-full bg-${c}-500 ${color === c ? 'ring-2 ring-white' : 'opacity-50'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    {editingCat && (
                                        <button type="button" onClick={handleDelete} className="p-3 bg-red-500/10 text-red-400 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                                    )}
                                    <button type="submit" className="flex-1 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400">Guardar</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Categories;
