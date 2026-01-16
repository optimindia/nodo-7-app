import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useNotifications = (user) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // 1. Setup & Fetch
    useEffect(() => {
        if (!user) return;

        // Fetch initial
        const fetchNotifs = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        };

        fetchNotifs();

        // Realtime Subscription
        const subscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
                const newNotif = payload.new;
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Trigger Browser Notification
                if (Notification.permission === 'granted') {
                    new Notification(newNotif.title, {
                        body: newNotif.message,
                        icon: '/favicon.ico' // Updated later
                    });
                }
            })
            .subscribe();

        // Request Permission on mount
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    // 2. Actions
    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase.from('notifications').update({ read: true }).eq('id', id);
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    };

    const addNotification = async (title, message, type = 'system') => {
        if (!user) return;
        const { data, error } = await supabase.from('notifications').insert([{
            user_id: user.id,
            title,
            message,
            type
        }]).select();

        // Trigger safe browser notification manually if insert worked
        if (data && Notification.permission === 'granted') {
            // Browser requires user interaction usually, but here we are in an async flow.
            // We try-catch to avoid crashing.
            try {
                new Notification(title, {
                    body: message,
                    icon: '/vite.svg', // Default vite icon as placeholder
                    silent: false
                });
            } catch (e) {
                console.error("Browser notification failed", e);
            }
        }
    };

    const deleteNotification = async (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // Recalculate unread count locally for instant UI update
        const isRead = notifications.find(n => n.id === id)?.read;
        if (!isRead) setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase.from('notifications').delete().eq('id', id);
    };

    // 3. Motivation Engine (Called by Dashboard with data)
    const analyzeAndNotify = (stats, goals, transactions) => {
        if (!stats || !user) return;

        // Dev Mode: Relaxed check
        // const checkKey = `last_check_${new Date().toDateString()}`;
        // if (localStorage.getItem(checkKey)) return; 

        // Prevent spam: Check if we sent a notification in the last minute
        const lastNotif = notifications[0];
        if (lastNotif && new Date(lastNotif.created_at) > new Date(Date.now() - 60000)) return;

        // Logic: Savings Streak
        if (stats.totalBalance > 1000000) {
            const storageKey = `notified_milestone_millionaire_${user.id}`;
            const lastNotified = localStorage.getItem(storageKey);

            // Only notify if never notified or last notification was > 30 days ago (monthly reminder of greatness)
            if (!lastNotified || new Date() - new Date(lastNotified) > 30 * 24 * 60 * 60 * 1000) {
                addNotification('¡Modo Leyenda Activado! 🚀', 'Has superado la barrera del millón. Tu disciplina financiera es de otro nivel.', 'motivation');
                localStorage.setItem(storageKey, new Date().toISOString());
            }
        }

        // Logic: Goal Progress
        if (goals && goals.length > 0) {
            const nearestGoal = goals.sort((a, b) => (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount))[0];
            const progress = (nearestGoal.current_amount / nearestGoal.target_amount);

            if (progress > 0.8 && progress < 1) {
                const storageKey = `notified_goal_progress_${nearestGoal.id}_${user.id}`;
                const lastNotified = localStorage.getItem(storageKey);

                // Notify if not notified in last 24 hours
                if (!lastNotified || new Date() - new Date(lastNotified) > 24 * 60 * 60 * 1000) {
                    addNotification('¡A punto de caramelo! 🍭', `Solo te falta un empujón para "${nearestGoal.title}". ¡Visualiza el éxito!`, 'motivation');
                    localStorage.setItem(storageKey, new Date().toISOString());
                }
            }
        }

        // Logic: Income Analysis (High Value Deposit)
        // CRITICAL: We use 'created_at' to detect RECENT system activity.
        const recentHighDeposit = transactions.find(t =>
            t.type === 'deposit' &&
            t.amount > 5000 &&
            // Check if created in the last hour
            new Date(t.created_at) > new Date(Date.now() - 3600000)
        );

        if (recentHighDeposit) {
            const storageKey = `notified_tx_ids_${user.id}`;
            const notifiedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');

            // Check if this specific transaction ID has already triggered an alert
            if (!notifiedIds.includes(recentHighDeposit.id)) {
                const formattedAmount = new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(recentHighDeposit.amount);
                addNotification(
                    '¡Impacto de Ingresos! 💰',
                    `Ese ingreso reciente de ${formattedAmount} ha disparado tus estadísticas. ¡Sigue así!`,
                    'success'
                );

                // Save ID to prevent loop
                notifiedIds.push(recentHighDeposit.id);
                // Keep array small (last 50 is plenty)
                if (notifiedIds.length > 50) notifiedIds.shift();
                localStorage.setItem(storageKey, JSON.stringify(notifiedIds));
            }
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        deleteNotification,
        analyzeAndNotify,
        addNotification
    };
};
