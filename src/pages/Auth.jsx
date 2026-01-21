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
            return 'Credenciales incorrectas. Verifique sus datos.';
        }
        if (msg.includes('valid email')) {
            return 'Por favor, introduce un correo válido.';
        }
        if (msg.includes('password')) {
            return 'La contraseña es muy corta (mínimo 6 caracteres).';
        }
        return 'Ocurrió un error inesperado.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Artificial delay for UX (feel the power)
            await new Promise(resolve => setTimeout(resolve, 800));

            if (isLogin) {
                const { error: signInError } = await signIn(email, password);
                if (signInError) throw signInError;
            } else {
                const { error: signUpError } = await signUp(email, password);
                if (signUpError) throw signUpError;
            }
        } catch (err) {
            console.error(err);
            setError(translateError(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#030712] text-white overflow-hidden relative z-20">
            {/* LEFT SIDE - BRAND IMMERSION (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black/40 items-center justify-center p-12 overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />

                {/* Content */}
                <div className="relative z-10 max-w-lg text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8 relative inline-block"
                    >
                        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20" />
                        <img src="/logo.svg" alt="OptiCash" className="h-20 w-auto relative z-10 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl font-extrabold tracking-tight mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
                    >
                        Domina tus <br /> <span className="text-cyan-400">Finanzas Personales</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-xl text-gray-400 font-light leading-relaxed"
                    >
                        La plataforma que transforma tus metas en realidad. Inteligencia artificial, análisis profundo y control total.
                    </motion.p>

                    {/* Testimonial / Social Proof Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mt-12 inline-flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-200">
                                    {i === 3 ? '+' : <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-50" />}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-white/60"><span className="text-cyan-400 font-bold">+2000</span> Usuarios activos</span>
                    </motion.div>
                </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
                {/* Mobile Background Ambience */}
                <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full" />
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8 relative z-10"
                >
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <img src="/icon.svg" alt="Icon" className="w-12 h-12 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">
                            {isLogin ? 'Bienvenido de nuevo' : 'Crear Cuenta'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {isLogin
                                ? 'Ingresa tus credenciales para acceder al panel.'
                                : 'Completa el formulario para comenzar tu prueba gratuita.'}
                        </p>
                    </div>

                    {isLogin ? (
                        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                            <div className="space-y-2 group">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 group-focus-within:text-cyan-400 transition-colors">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all sm:text-sm"
                                        placeholder="nombre@empresa.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 group-focus-within:text-cyan-400 transition-colors">Contraseña</label>
                                    <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">¿Olvidaste tu contraseña?</a>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all sm:text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-500/20 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md">
                            <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Acceso Exclusivo</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Actualmente OptiCash es una plataforma privada solo por invitación.
                            </p>
                            <a
                                href="https://wa.me/5492616027055?text=Hola,%20quiero%20solicitar%20acceso%20a%20NODO%207"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/30"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                Solicitar Acceso
                            </a>
                        </div>
                    )}

                    {/* Toggle Auth Mode */}
                    <div className="text-center pt-4">
                        <p className="text-sm text-gray-400">
                            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes acceso?'}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {isLogin ? 'Solicitar Demo' : 'Iniciar Sesión'}
                            </button>
                        </p>
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

export default Auth;
