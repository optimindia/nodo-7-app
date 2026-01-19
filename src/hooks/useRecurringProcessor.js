import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useRecurringProcessor = (user) => {
    useEffect(() => {
        if (user) {
            checkAndProcessRecurring();
        }
    }, [user]);

    const checkAndProcessRecurring = async () => {
        // 1. Fetch active templates due today or in the past
        const today = new Date().toISOString().split('T')[0];
        const { data: templates } = await supabase
            .from('recurring_templates')
            .select('*')
            .eq('user_id', user.id)
            .eq('active', true)
            .lte('next_due_date', today);

        if (!templates || templates.length === 0) return;

        // 2. Process each template
        for (const template of templates) {
            // Create Transaction
            await supabase.from('transactions').insert([{
                user_id: user.id,
                wallet_id: template.wallet_id,
                amount: template.amount,
                type: template.type, // 'income' or 'expense'
                category: template.category,
                description: `Recurrente: ${template.description}`,
                date: new Date().toISOString()
            }]);

            // Calculate next due date
            let nextDate = new Date(template.next_due_date);
            if (template.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (template.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (template.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
            else if (template.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);

            // Update Template
            await supabase.from('recurring_templates')
                .update({ next_due_date: nextDate.toISOString().split('T')[0] })
                .eq('id', template.id);
        }

        // Optional: Notify user (could add a toast or notification system call here)
        console.log(`Processed ${templates.length} recurring transactions.`);
    };
};
