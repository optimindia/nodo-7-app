import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, DollarSign, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const PayDebtModal = ({ isOpen, onClose, debt, userId, wallets, onPaymentSuccess }) => {
    const [amount, setAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Filter wallets that belong to the user (redundant if passed correctly but safe)
    const userWallets = wallets || [];
    const selectedWallet = userWallets.find(w => w.id === selectedWalletId);

    // Initialize Amount & Default Wallet
    useEffect(() => {
        if (isOpen && debt) {
            // Default to min payment or full balance if smaller
            const suggested = Math.min(Number(debt.current_balance), Number(debt.min_payment));
            setAmount(suggested > 0 ? suggested.toString() : '');
            setSuccess(false);
            setError(null);

            // Select first wallet with balance > 0 if possible
            if (userWallets.length > 0 && !selectedWalletId) {
                const bestWallet = userWallets.find(w => w.balance > suggested) || userWallets[0];
                setSelectedWalletId(bestWallet.id);
            }
        }
    }, [isOpen, debt, userWallets]);

    const handlePay = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!selectedWalletId) throw new Error("Selecciona una billetera");
            if (Number(amount) <= 0) throw new Error("El monto debe ser mayor a 0");
            if (Number(amount) > Number(debt.current_balance)) throw new Error("No puedes pagar más de lo que debes");

            // Balance Check
            if (selectedWallet && selectedWallet.balance < Number(amount)) {
                if (!window.confirm("Advertencia: El saldo de esta billetera es insuficiente. ¿Continuar y dejar saldo negativo?")) {
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase.rpc('pay_debt', {
                p_debt_id: debt.id,
                p_wallet_id: selectedWalletId,
                p_amount: Number(amount),
                p_description: `Pago a ${debt.name}`,
                p_user_id: userId,
                p_date: new Date().toISOString().split('T')[0]
            });

            if (error) throw error;
            if (data && data.success === false) throw new Error(data.error);

            setSuccess(true);
            setTimeout(() => {
                if (onPaymentSuccess) onPaymentSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            console.error(err);
            setError(err.message || "Error al procesar el pago");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !debt) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {success ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white">¡Pago Exitoso!</h3>
                            <p className="text-white/60">Tu deuda ha disminuido.</p>
                        </div>
                    ) : (
                        <form onSubmit={handlePay} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <DollarSign className="w-6 h-6 text-emerald-400" />
                                    Realizar Pago
                                </h3>
                                <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            {/* Debt Info */}
                            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-white/40 uppercase">Abonando a</p>
                                    <p className="font-bold text-white text-lg">{debt.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/40 uppercase">Saldo Actual</p>
                                    <p className="font-mono text-white">${Number(debt.current_balance).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-white/40 uppercase ml-1 mb-2 block">Monto a Pagar</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 focus:border-emerald-500 rounded-xl py-4 pl-8 pr-4 text-2xl font-bold text-white outline-none"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Wallet Selection */}
                            <div className="mb-8">
                                <label className="text-xs font-bold text-white/40 uppercase ml-1 mb-2 block">Pagar desde</label>
                                <div className="relative">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <select
                                        value={selectedWalletId}
                                        onChange={e => setSelectedWalletId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-white/30 cursor-pointer hover:bg-white/10"
                                    >
                                        {userWallets.length === 0 ? <option>Cargando billeteras...</option> : null}
                                        {userWallets.map(w => (
                                            <option key={w.id} value={w.id} className="bg-[#0f172a]">
                                                {w.name} (Saldo: ${w.balance?.toLocaleString() || '0'})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                                {selectedWallet && selectedWallet.balance < Number(amount) && (
                                    <div className="mt-2 flex items-center gap-2 text-orange-400 text-xs bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                                        <AlertCircle className="w-4 h-4" />
                                        Saldo insuficiente. Quedará en negativo.
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform active:scale-95 disabled:opacity-50 disabled:transform-none"
                            >
                                {loading ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PayDebtModal;
