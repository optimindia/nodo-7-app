import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useBudgets = (transactions = []) => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Budgets
    const fetchBudgets = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBudgets(data);
        } catch (err) {
            console.error('Error fetching budgets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Progress (Client-side for speed)
    // Returns budgets enhanced with 'spent' and 'percentage'
    const getBudgetsWithProgress = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // 1. Filter transactions for this month
        const thisMonthTransactions = transactions.filter(tx => {
            const date = new Date(tx.date || tx.created_at);
            return date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear &&
                tx.type === 'withdrawal'; // Only expenses count against budget
        });

        // 2. Map budgets adding spent amount
        return budgets.map(budget => {
            const spent = thisMonthTransactions
                .filter(tx => tx.category === budget.category)
                .reduce((sum, tx) => sum + Number(tx.amount), 0);

            const progress = (spent / Number(budget.amount)) * 100;

            return {
                ...budget,
                spent,
                progress: Math.min(progress, 100), // Cap visual at 100%
                isOverBudget: spent > Number(budget.amount)
            };
        });
    };

    const createBudget = async (budgetData) => {
        try {
            const { data, error } = await supabase
                .from('budgets')
                .insert([{
                    user_id: user.id,
                    ...budgetData
                }])
                .select()
                .single();

            if (error) throw error;
            setBudgets(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error('Error creating budget:', err);
            throw err;
        }
    };

    const deleteBudget = async (id) => {
        try {
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setBudgets(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error('Error deleting budget:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [user]);

    return {
        budgets,
        budgetsWithProgress: getBudgetsWithProgress(),
        loading,
        error,
        createBudget,
        deleteBudget,
        refreshBudgets: fetchBudgets
    };
};
