import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Plus, TrendingDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import AddDebtModal from '../../components/debts/AddDebtModal';
import DebtCard from '../../components/debts/DebtCard';
import SnowballStrategy from '../../components/debts/SnowballStrategy';
import PayDebtModal from '../../components/debts/PayDebtModal';

const Debts = ({ wallets }) => { // Wallets passed from Layout with balance calculated
    const { user } = useAuth();
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedDebtToPay, setSelectedDebtToPay] = useState(null);
    const [monthlyBudget, setMonthlyBudget] = useState(0); // Total money available for debts

    // Fetch Debts
    const fetchDebts = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('debts')
            .select('*')
            .eq('user_id', user.id)
            .order('current_balance', { ascending: true }); // Default to Smallest Balance (Snowball)

        if (data) setDebts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchDebts();
    }, [user]);

    // Calculate Totals Safe
    const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const totalDebt = debts.reduce((acc, curr) => acc + toNum(curr.current_balance), 0);
    const totalMinPayments = debts.reduce((acc, curr) => acc + toNum(curr.min_payment), 0);

    // Derived State
    const extraCapacity = Math.max(0, monthlyBudget - totalMinPayments);
    const isBudgetLow = monthlyBudget > 0 && monthlyBudget < totalMinPayments;

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar esta deuda?")) return;
        await supabase.from('debts').delete().eq('id', id);
        setDebts(debts.filter(d => d.id !== id));
    };

    return (
        <div className="space-y-8 h-full flex flex-col relative pb-20">
            {/* Header & Guide */}
            <div className="shrink-0 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <TrendingDown className="w-8 h-8 text-red-500" />
                            Misión: Libertad
                        </h1>
                        <p className="text-white/60">Tu plan de batalla paso a paso.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transform active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden md:inline">Agregar Deuda</span>
                    </button>
                </div>

                {/* Simplified Onboarding */}
                {debts.length === 0 && (
                    <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">¡Bienvenido a tu Libertad Financiera!</h3>
                        <p className="text-white/60 mb-4">Para empezar, necesito que hagas clic en <strong className="text-white">"Agregar Deuda"</strong> y registres TODAS tus deudas.</p>
                        <p className="text-sm text-cyan-400">No importa si son grandes o pequeñas. Regístralas todas.</p>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto custom-scrollbar pr-2">

                {/* Left Col: Debt List & Budget Input (4 cols) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Budget Input Card - The most important part */}
                    <div className="p-6 rounded-3xl bg-[#1e293b] border border-white/10 relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Paso 1: Tu Presupuesto</h3>

                        <div className="mb-6">
                            <label className="text-sm font-bold text-white mb-2 block">
                                ¿Cuánto dinero puedes destinar <span className="text-cyan-400">en TOTAL</span> a tus deudas este mes?
                            </label>
                            <p className="text-xs text-white/50 mb-3">
                                Suma todo: lo que usas para pagar mínimos + cualquier dinero extra que tengas.
                            </p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">$</span>
                                <input
                                    type="number"
                                    value={monthlyBudget || ''}
                                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                                    className={`w-full bg-black/40 border ${isBudgetLow ? 'border-red-500 text-red-400' : 'border-white/10 focus:border-cyan-500 text-white'} rounded-xl p-3 pl-8 font-bold outline-none transition-all placeholder:text-white/10`}
                                    placeholder="Ej: 500.00"
                                />
                            </div>
                            {isBudgetLow && (
                                <div className="mt-2 flex items-start gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">
                                    <Info className="w-4 h-4 shrink-0" />
                                    <p>¡Cuidado! Esto no cubre tus pagos mínimos obligatorios (${totalMinPayments.toLocaleString()}). Necesitas más dinero.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center py-3 border-t border-white/5">
                            <p className="text-sm text-white/60">Tus Pagos Mínimos:</p>
                            <p className="text-sm font-bold text-white/80">${totalMinPayments.toLocaleString()}</p>
                        </div>

                        <div className="flex justify-between items-center py-3 border-t border-white/5">
                            <p className="text-sm text-cyan-400 font-bold">Poder de Ataque (Extra):</p>
                            <p className="text-lg font-black text-cyan-400">+${extraCapacity.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Debt List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Tus Deudas</h3>
                            <span className="text-xs text-white/30">Total: ${totalDebt.toLocaleString()}</span>
                        </div>

                        {debts.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                <p className="text-white/30 text-sm">Lista vacía</p>
                            </div>
                        ) : (
                            debts.map(debt => (
                                <div key={debt.id} className="relative group">
                                    <button
                                        onClick={() => handleDelete(debt.id)}
                                        className="absolute -right-2 -top-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                                        title="Eliminar Deuda"
                                    >
                                        <span className="sr-only">Eliminar</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                    <DebtCard debt={debt} onDelete={handleDelete} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Col: Action Plan (8 cols) */}
                <div className="lg:col-span-8">
                    {debts.length > 0 ? (
                        <SnowballStrategy
                            debts={debts}
                            monthlyExtra={extraCapacity}
                            budgetTotal={monthlyBudget}
                            onPayDebt={(debt) => {
                                setSelectedDebtToPay(debt);
                                setIsPayModalOpen(true);
                            }}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/30 border border-white/5 rounded-3xl bg-white/5">
                            <TrendingDown className="w-16 h-16 mb-4 opacity-20" />
                            <p>Agrega tus deudas a la izquierda para ver tu plan de ataque.</p>
                        </div>
                    )}
                </div>
            </div>

            <AddDebtModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onDebtAdded={fetchDebts}
                userId={user?.id}
            />

            <PayDebtModal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                debt={selectedDebtToPay}
                userId={user?.id}
                wallets={wallets}
                onPaymentSuccess={fetchDebts}
            />
        </div>
    );
};

export default Debts;
