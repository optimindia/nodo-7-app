import React, { useState } from 'react';
import { useUserRole } from '../../hooks/useUserRole';
import { useAdminData } from '../../hooks/useAdminData';
import { supabase } from '../../lib/supabaseClient';
import { Users, CreditCard, Activity, Plus, Search, Shield, User, DollarSign, Loader2, X, MoreVertical, Ban, Zap, Pencil, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const { role } = useUserRole();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Pass params to hook
    const { users, stats, currentUserProfile, loading, refreshData, totalRecords } = useAdminData(page, perPage, searchTerm);

    // Modals State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

    // Create User Form
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'client', credits: 0 });
    const [createLoading, setCreateLoading] = useState(false);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        let newUserId = null;

        try {
            // 0. Pre-check: If reseller, do you have credits? (Client-side check to save an API call)
            if (role === 'reseller' && newUser.role === 'client') {
                // Assuming 'currentUserProfile' has the up-to-date credits from the hook
                if ((currentUserProfile?.credits || 0) < 1) {
                    throw new Error("No tienes créditos suficientes para crear un cliente.");
                }
            }

            // Get current user ID for 'created_by'
            const currentUserId = (await supabase.auth.getUser()).data.user.id;

            // 1. Create User (Auth) - This is the most likely step to fail (duplicate email, weak password)
            const { createClient } = await import('@supabase/supabase-js');
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
            );

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: { data: { created_by: currentUserId } }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario");

            newUserId = authData.user.id; // Mark for potential rollback

            // 2. Wait for Trigger (Profile creation)
            await new Promise(r => setTimeout(r, 1000));

            // 3. Update Profile Data
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    role: newUser.role,
                    credits: newUser.role === 'client' ? 0 : parseInt(newUser.credits),
                    created_by: currentUserId
                })
                .eq('id', newUserId);

            if (updateError) throw new Error("Error actualizando perfil: " + updateError.message);

            // 4. CRITICAL: Deduct Credit (Only if we got here, meaning User + Profile exists)
            if (role === 'reseller' && newUser.role === 'client') {
                const { data: deduction, error: deductError } = await supabase.rpc('deduct_reseller_credit', { p_amount: 1 });

                if (deductError || !deduction.success) {
                    // DEDUCTION FAILED - ROLLBACK USER
                    console.error("Deduction failed, rolling back user creation...");
                    await supabase.rpc('delete_user_by_id', { target_user_id: newUserId }); // Needs Admin privs or Service Role, might fail if Reseller.
                    // If Reseller can't delete, we have a "zombie" free user. 
                    // Better approach: The Database Trigger for 'deduct_credit' is safer, but complexity increases.
                    // For this app scale: This "Optimistic Creation" is better than "Lost Credits".
                    throw new Error("Error procesando créditos: " + (deductError?.message || deduction?.message));
                }
            }

            // Success
            setIsCreateModalOpen(false);
            setNewUser({ email: '', password: '', role: 'client', credits: 0 });
            refreshData();
            alert('Usuario creado exitosamente 🚀');

        } catch (error) {
            console.error("Create user error:", error);
            // If we have a newUserId but failed later (e.g. profile update), we should ideally clean up too.
            // But the most important requirement is: DONT DEDUCT IF CREATE FAILS.
            // Since we moved deduction to the END, this is satisfied.
            alert('Error: ' + error.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleToggleStatus = async (user) => {
        const isBanned = user.subscription_status === 'inactive';
        const action = isBanned ? 'desbloquear' : 'bloquear';
        const newStatus = isBanned ? 'active' : 'inactive';

        if (!window.confirm(`¿Seguro que quieres ${action} a este usuario?`)) return;

        try {
            const { error } = await supabase.rpc('update_user_admin', {
                target_user_id: user.id,
                new_status: newStatus
            });
            if (error) throw error;
            refreshData();
            alert(`Usuario ${isBanned ? 'desbloqueado' : 'bloqueado'} exitosamente.`);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`¿ESTÁS SEGURO? \n\nVas a eliminar permanentemente al usuario ${user.email}.\nEsta acción NO se puede deshacer y borrará todos sus datos (billeteras, metas, etc).`)) return;

        try {
            const { data, error } = await supabase.rpc('delete_user_by_id', {
                target_user_id: user.id
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message);

            refreshData();
            alert('Usuario eliminado permanentemente.');
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error al eliminar: " + error.message);
        }
    };

    const isReseller = role === 'reseller';

    return (
        <div className="space-y-8 animate-fade-in relative pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Panel de Administración
                    </h1>
                    <p className="text-white/60 mt-2">
                        Bienvenido, <span className="uppercase font-semibold text-cyan-400">{role}</span>.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={refreshData}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
                        title="Recargar datos"
                    >
                        <Activity className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden md:inline">Nuevo Usuario</span>
                    </button>
                </div>
            </header>

            {/* Scoped Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label={isReseller ? "Mis Clientes" : "Usuarios Totales"}
                    value={stats.totalUsers}
                    // Note: Logic in hook should ideally filter totalUsers for Reseller seeing only their created list. 
                    // Current hook returns filtered list for Resellers due to RLS, so logic holds.
                    color="blue"
                    subvalue={isReseller ? "Activos" : `${stats.resellers} Revendedores`}
                />
                <StatCard
                    icon={CreditCard}
                    label={isReseller ? "Mis Créditos" : "Créditos Globales"}
                    value={isReseller ? stats.myCredits : stats.totalCredits}
                    color="purple"
                    subvalue={isReseller ? "Disponible para venta" : "En circulación"}
                />
                <StatCard
                    icon={Activity}
                    label="Usuarios Activos"
                    value={stats.activeUsers}
                    color="green"
                    subvalue="Suscripción válida"
                />
                <StatCard
                    icon={DollarSign}
                    label="Ingresos Estimados"
                    value={"$0"}
                    color="yellow"
                    subvalue="Próximamente"
                />
            </div>

            {/* Users Table Section */}
            <div className="glass-panel p-6 rounded-2xl bg-[#0f172a]/50 border border-white/10 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold">Base de Usuarios</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="p-4 font-medium">Usuario</th>
                                <th className="p-4 font-medium">Rol</th>
                                <th className="p-4 font-medium">Créditos</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium">Avance</th>
                                <th className="p-4 font-medium">Creado Por</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-white/40"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-white/40">Sin resultados.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">{user.email}</span>
                                                    <span className="text-[10px] text-white/40">{user.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><RoleBadge role={user.role} /></td>
                                        <td className="p-4 text-cyan-400 font-mono font-bold">{user.credits}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.subscription_status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {user.subscription_status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.has_completed_setup ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500'}`} />
                                                <span className={`text-xs ${user.has_completed_setup ? 'text-green-400' : 'text-yellow-400/80'}`}>
                                                    {user.has_completed_setup ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-white/30 font-mono">
                                            {user.created_by ? user.created_by.slice(0, 8) + '...' : 'System'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedUser(user); setIsCreditModalOpen(true); }} title="Recargar" className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400">
                                                    <Zap className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }} title="Editar" className="p-2 hover:bg-white/10 rounded-lg text-white">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.subscription_status === 'inactive' ? "Desbloquear" : "Bloquear"}
                                                    className={`p-2 rounded-lg transition-colors ${user.subscription_status === 'inactive'
                                                        ? 'text-green-400 hover:bg-green-500/20'
                                                        : 'text-red-400 hover:bg-red-500/20'
                                                        }`}
                                                >
                                                    {user.subscription_status === 'inactive' ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    title="Eliminar Usuario"
                                                    className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm text-white/40">
                        Mostrando {users.length} de {totalRecords} usuarios
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 text-sm bg-white/5 rounded-lg text-cyan-400 font-mono">
                            Pág {page}
                        </span>
                        <button
                            disabled={page * perPage >= totalRecords}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Create User Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Crear Nuevo Usuario">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <Input label="Email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                    <Input label="Contraseña" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Rol" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="client">Cliente</option>
                            <option value="reseller">Revendedor</option>
                            {!isReseller && <option value="admin">Admin</option>}
                        </Select>
                        {newUser.role !== 'client' && (
                            <Input
                                label="Créditos Iniciales"
                                type="number"
                                value={newUser.credits}
                                onChange={e => setNewUser({ ...newUser, credits: e.target.value })}
                            />
                        )}
                    </div>
                    <Button loading={createLoading}>Crear Usuario</Button>
                </form>
            </Modal>

            {/* 2. Rechage Credits Modal */}
            {selectedUser && (
                <ManageCreditsModal
                    isOpen={isCreditModalOpen}
                    onClose={() => { setIsCreditModalOpen(false); setSelectedUser(null); }}
                    user={selectedUser}
                    onSuccess={refreshData}
                />
            )}

            {/* 3. Edit User Modal */}
            {selectedUser && (
                <EditUserModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                    user={selectedUser}
                    onSuccess={refreshData}
                    currentUserRole={role}
                />
            )}
        </div>
    );
};

// --- Sub-Components ---

const Modal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-xl font-bold">{title}</h3>
                        <button onClick={onClose}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
                    </div>
                    <div className="p-6">{children}</div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

const ManageCreditsModal = ({ isOpen, onClose, user, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.rpc('manage_credits', {
                target_user_id: user.id,
                amount: parseInt(amount)
            });
            if (error) throw error;
            onSuccess();
            onClose();
            alert('Créditos actualizados exitosamente.');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Créditos: ${user.email}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-sm text-white/60 mb-4">
                    Saldo actual: <span className="text-cyan-400 font-bold">{user.credits}</span>
                </div>
                <Input label="Cantidad a Transferir (Use negativo para restar)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ej: 50 o -10" required />
                <Button loading={loading}>Confirmar Transacción</Button>
            </form>
        </Modal>
    );
};

const EditUserModal = ({ isOpen, onClose, user, onSuccess, currentUserRole }) => {
    const [formData, setFormData] = useState({ password: '', status: user.subscription_status, role: user.role });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.rpc('update_user_admin', {
                target_user_id: user.id,
                new_status: formData.status,
                new_password: formData.password || null,
                new_role: formData.role
            });
            if (error) throw error;
            onSuccess();
            onClose();
            alert('Usuario actualizado.');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Usuario">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select label="Estado" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo (Ban)</option>
                    <option value="trial">Prueba</option>
                </Select>
                {currentUserRole === 'admin' && (
                    <Select label="Rol" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                        <option value="client">Cliente</option>
                        <option value="reseller">Revendedor</option>
                        <option value="admin">Admin</option>
                    </Select>
                )}
                <Input label="Nueva Contraseña (Opcional)" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Dejar vacío para no cambiar" />
                <Button loading={loading}>Guardar Cambios</Button>
            </form>
        </Modal>
    );
};

const Input = ({ label, ...props }) => (
    <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-white/40">{label}</label>
        <input className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" {...props} />
    </div>
);

const Select = ({ label, children, ...props }) => (
    <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-white/40">{label}</label>
        <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none appearance-none" {...props}>
            {children}
        </select>
    </div>
);

const Button = ({ children, loading }) => (
    <button disabled={loading} className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
);

const StatCard = ({ icon: Icon, label, value, color, subvalue }) => {
    const colors = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20', green: 'text-green-400 bg-green-500/10 border-green-500/20', yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return (
        <div className={`p-6 rounded-2xl border ${colors[color].replace('text-', 'border-').split(' ')[2]} bg-white/5`}>
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={24} /></div>
                <div><h3 className="text-sm font-medium text-white/60">{label}</h3><p className="text-xs font-bold opacity-50">{subvalue}</p></div>
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
};

const RoleBadge = ({ role }) => {
    const styles = { admin: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', reseller: 'bg-purple-500/20 text-purple-400 border-purple-500/30', client: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    const icons = { admin: Shield, reseller: DollarSign, client: User };
    const Icon = icons[role] || User;
    return <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide ${styles[role] || styles.client}`}><Icon className="w-3 h-3" />{role}</div>;
};

export default AdminDashboard;
