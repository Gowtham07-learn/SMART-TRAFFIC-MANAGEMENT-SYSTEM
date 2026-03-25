import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, hasAccess } from '../../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role } = useAuth();

    // Block unauthenticated users completely.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!hasAccess(role, allowedRoles)) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] bg-slate-950 text-slate-100 p-6 rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-red-500/5 backdrop-blur-3xl z-0 pointer-events-none"></div>
                <div className="z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <ShieldAlert size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-4">Access Denied</h1>
                    <p className="text-slate-400 text-lg mb-8 max-w-md text-center">
                        You do not have the required permissions to view this module. Your current role is <span className="text-white font-bold">{role}</span>.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-black/50"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return children;
};
