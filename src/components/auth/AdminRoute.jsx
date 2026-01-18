import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { Loader2 } from 'lucide-react';

export const AdminRoute = () => {
    const { role, loading, canManageUsers } = useUserRole();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#030712]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    // Only Admin and Reseller can access
    if (!canManageUsers) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
