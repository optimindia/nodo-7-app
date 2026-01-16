import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useGoals } from '../../hooks/useGoals';

const AIChat = () => {
    // Hooks for Real Data
    const { stats, transactions, formatCurrency } = useDashboardData();
    const { goals } = useGoals();

    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', content: '¡Hola! Soy OptiMind IA. Tengo acceso a tus finanzas en tiempo real. ¿Qué te gustaría saber hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Simple Intent Parser
    const generateResponse = (query) => {
        const lowerQuery = query.toLowerCase();

        // 1. Balance Queries
        if (lowerQuery.includes('balance') || lowerQuery.includes('dinero tengo') || lowerQuery.includes('total') || lowerQuery.includes('saldo')) {
            return `Tu saldo total actual es de **${formatCurrency(stats.totalBalance)}**.`;
        }

        // 2. Goals Queries
        if (lowerQuery.includes('meta') || lowerQuery.includes('objetivo') || lowerQuery.includes('auto') || lowerQuery.includes('viaje')) {
            if (goals.length === 0) return "Aún no tienes metas activas. ¿Te gustaría crear una?";

            // Try to find specific goal
            const specificGoal = goals.find(g => lowerQuery.includes(g.title.toLowerCase()));
            if (specificGoal) {
                const progress = (specificGoal.current_amount / specificGoal.target_amount) * 100;
                const remaining = specificGoal.target_amount - specificGoal.current_amount;
                return `Para tu meta **"${specificGoal.title}"** llevas ahorrado **${formatCurrency(specificGoal.current_amount)}** (${progress.toFixed(1)}%). Te faltan **${formatCurrency(remaining)}** para alcanzar el objetivo.`;
            }

            return `Tienes **${goals.length} metas activas**. La más cercana a completarse es "${goals[0].title}".`;
        }

        // 3. Spending/Transactions Logic
        if (lowerQuery.includes('gastos') || lowerQuery.includes('gastado')) {
            // Simple sum of withdrawals/payments
            const totalSpent = transactions
                .filter(t => t.type === 'withdrawal' || t.type === 'payment')
                .reduce((acc, t) => acc + Number(t.amount), 0);
            return `Hasta la fecha, tus gastos registrados suman un total de **${formatCurrency(totalSpent)}**.`;
        }

        // 4. Savings/Profit Logic
        if (lowerQuery.includes('ahorrado') || lowerQuery.includes('ganancia') || lowerQuery.includes('rendimiento')) {
            return `Tus ganancias por rendimiento (yields) suman **${formatCurrency(stats.totalProfit)}**. ¡Sigue así!`;
        }

        // Fallback / Chit-Chat
        const fallbacks = [
            "Entiendo. Según mis análisis, vas por buen camino, pero siempre es bueno revisar tus gastos hormiga.",
            "Interesante pregunta. Basado en tus datos, mantienes una salud financiera estable.",
            "Puedo ayudarte a desglosar tus transacciones si lo necesitas.",
            "Recuerda que la consistencia es clave para alcanzar tus metas financieras."
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate thinking delay
        setTimeout(() => {
            const responseText = generateResponse(userMsg.content);

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: responseText
            }]);
            setIsTyping(false);
        }, 1200);
    };

    const suggestions = [
        "¿Cuánto dinero tengo en total?",
        "¿Cómo van mis metas?",
        "¿Cuánto he gastado?",
        "Mis rendimientos"
    ];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col relative max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        OptiMind IA
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] border border-cyan-500/20">CONNECTED</span>
                    </h1>
                    <p className="text-white/40 text-sm">Tu asistente financiero con acceso a tus datos reales.</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 custom-scrollbar">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                            ${msg.role === 'assistant'
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20'
                                : 'bg-white/10'}`}
                        >
                            {msg.role === 'assistant' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                        </div>

                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                            ${msg.role === 'assistant'
                                ? 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                                : 'bg-cyan-600 text-white rounded-tr-none shadow-lg'}`}
                        >
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative">
                {messages.length === 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(s)}
                                className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
                            >
                                <Sparkles className="w-3 h-3" />
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregúntame sobre tu balance, metas o gastos..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all shadow-xl"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 p-2 rounded-xl bg-cyan-500 text-white disabled:opacity-50 disabled:bg-white/10 hover:bg-cyan-400 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChat;
