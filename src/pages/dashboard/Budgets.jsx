import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useBudgets } from '../../hooks/useBudgets';
import BudgetCard from '../../components/budgets/BudgetCard';
import CreateBudgetModal from '../../components/budgets/CreateBudgetModal';

const Budgets = ({ transactions }) => {
    // We receive transactions from Layout/DashboardHome to calculate progress
    const { budgetsWithProgress, loading, createBudget, deleteBudget } = useBudgets(transactions);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Presupuestos</h1>
                    <p className="text-white/40">Controla tus gastos mensuales por categoría</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-3 bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/30 hover:scale-110 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    // Skeletons
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />
                    ))
                ) : budgetsWithProgress.length > 0 ? (
                    budgetsWithProgress.map(budget => (
                        <BudgetCard
                            key={budget.id}
                            budget={budget}
                            onDelete={deleteBudget}
                        />
                    ))
                ) : (
                    // Empty State
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <span className="text-4xl">📉</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No tienes presupuestos activos</h3>
                        <p className="text-white/40 max-w-xs mx-auto mb-8">
                            Crea tu primer presupuesto para empezar a ahorrar más dinero cada mes.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                        >
                            Crear mi primer presupuesto
                        </button>
                    </div>
                )}
            </div>

            <CreateBudgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={createBudget}
            />
        </div>
    );
};

export default Budgets;
