import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { signIn, signUp } = useAuth();

    const translateError = (errorMessage) => {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('user already registered') || msg.includes('unique constraint')) {
            return 'Este correo ya está registrado. Por favor, inicia sesión.';
        }
        if (msg.includes('invalid login credentials')) {
            return 'Credenciales incorrectas. Si no tienes cuenta, por favor regístrate.';
        }
        if (msg.includes('valid email') || msg.includes('invalid email')) {
            return 'Por favor, introduce un correo electrónico válido.';
        }
        if (msg.includes('password') && msg.includes('short')) {
            return 'La contraseña debe tener al menos 6 caracteres.';
        }
        return 'Ocurrió un error. Por favor, intenta de nuevo.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
            }
        } catch (err) {
            console.error(err);
            setError(translateError(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030712]">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-700/20 to-blue-600/20 blur-[100px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-cyan-600/20 to-emerald-500/20 blur-[100px] animate-blob animation-delay-2000" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[80px] animate-pulse" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-2xl relative overflow-hidden group">

                    {/* Gloss Light Reflection */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-b from-white/10 to-transparent blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative z-10 text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"
                        >
                            <Sparkles className="w-8 h-8 text-white fill-white" />
                        </motion.div>
                        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                            {isLogin ? 'Bienvenido' : 'Únete'}
                        </h2>
                        <p className="text-white/50 text-base font-light">
                            {isLogin ? 'Tu universo digital te espera.' : 'Comienza tu viaje hacia el futuro hoy.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2 group/input"
                        >
                            <label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1 group-focus-within/input:text-cyan-400 transition-colors">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within/input:text-cyan-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300"
                                    placeholder="nombre@ejemplo.com"
                                    required
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2 group/input"
                        >
                            <label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1 group-focus-within/input:text-secondary transition-colors">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within/input:text-secondary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary/50 focus:bg-white/10 focus:ring-4 focus:ring-secondary/10 transition-all duration-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-red-200 leading-relaxed font-medium">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-bold rounded-2xl text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:bg-[length:200%_200%] bg-[length:100%_100%] animate-gradient hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Acceder ahora' : 'Crear Cuenta'}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 pt-6 border-t border-white/10 text-center"
                    >
                        <p className="text-white/40 text-sm">
                            {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres miembro?'}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-white hover:to-white transition-all duration-300"
                            >
                                {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
                            </button>
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
