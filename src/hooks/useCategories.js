import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useCategories = () => {
    const { session } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchCategories();
        }
    }, [session]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const addCategory = async (categoryData) => {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ ...categoryData, user_id: session.user.id, display_order: 999 }]) // Default to end
            .select()
            .single();

        if (error) throw error;
        await fetchCategories(); // Refresh list
        return data; // Return the new category
    };

    const updateCategory = async (id, updates) => {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
        fetchCategories();
    };

    const deleteCategory = async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        fetchCategories();
    };

    const seedDefaults = async () => {
        const defaults = [
            { name: 'Salario', type: 'income', icon: '💰', color: 'green' },
            { name: 'Freelance', type: 'income', icon: '💻', color: 'blue' },
            { name: 'Alimentación', type: 'expense', icon: '🍔', color: 'orange' },
            { name: 'Transporte', type: 'expense', icon: '🚌', color: 'yellow' },
            { name: 'Vivienda', type: 'expense', icon: '🏠', color: 'purple' },
            { name: 'Entretenimiento', type: 'expense', icon: '🎬', color: 'pink' },
            { name: 'Salud', type: 'expense', icon: '🏥', color: 'red' },
            { name: 'Compras', type: 'expense', icon: '🛍️', color: 'cyan' },
        ];

        const rows = defaults.map(d => ({ ...d, user_id: session.user.id }));

        const { error } = await supabase.from('categories').insert(rows);
        if (error) throw error;
        fetchCategories();
    };

    return {
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        seedDefaults,
        refreshCategories: fetchCategories
    };
};
