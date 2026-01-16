import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useGoals = () => {
    const { session } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchGoals();
        }
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

    const createGoal = async (goalData) => {
        const { error } = await supabase
            .from('goals')
            .insert([{ ...goalData, user_id: session.user.id }]);
        if (error) throw error;
        fetchGoals();
    };

    const updateGoal = async (id, updates) => {
        const { error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
        fetchGoals();
    };

    const deleteGoal = async (id) => {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);
        if (error) throw error;
        fetchGoals();
    };

    return { goals, loading, createGoal, updateGoal, deleteGoal, refreshGoals: fetchGoals };
};
