import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { Shield, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const roleLabels = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.TRAFFIC_CONTROLLER]: 'Traffic Controller',
    [ROLES.EMERGENCY_DRIVER]: 'Emergency Unit',
    [ROLES.CITIZEN]: 'Citizen Portal'
};

const roleColors = {
    [ROLES.ADMIN]: 'from-purple-600 to-indigo-600 text-purple-400 border-purple-500/30 bg-purple-500/10',
    [ROLES.TRAFFIC_CONTROLLER]: 'from-blue-600 to-cyan-600 text-blue-400 border-blue-500/30 bg-blue-500/10',
    [ROLES.EMERGENCY_DRIVER]: 'from-red-600 to-orange-600 text-red-400 border-red-500/30 bg-red-500/10',
    [ROLES.CITIZEN]: 'from-green-600 to-emerald-600 text-green-400 border-green-500/30 bg-green-500/10'
};

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-redirect if already logged in natively
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/', { replace: true });
        } else {
            setError(result.error || 'Incorrect email or password');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 mb-6">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Smart Traffic AI</h1>
                    <p className="text-slate-400">Select your role and authenticate to continue</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300">Select Designation</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(ROLES).map((roleVal) => (
                                    <button
                                        key={roleVal}
                                        type="button"
                                        onClick={() => {
                                            setSelectedRole(roleVal);
                                            setError('');
                                        }}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center text-center h-20 ${
                                            selectedRole === roleVal 
                                                ? roleColors[roleVal]
                                                : 'border-slate-800 bg-slate-900 shadow-sm text-slate-400 hover:bg-slate-800/60'
                                        }`}
                                    >
                                        {roleLabels[roleVal]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400 text-sm animate-pulse">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl text-white font-bold flex flex-col items-center justify-center space-y-1 transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 bg-gradient-to-r ${roleColors[selectedRole].split(' ')[0]} ${roleColors[selectedRole].split(' ')[1]}`}
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <span>Authenticate</span>
                            )}
                        </button>
                        
                    </form>
                </div>
                
                <p className="text-center text-slate-500 text-xs mt-8 font-medium">
                    Simulated User Gateway &copy; 2026 Smart Traffic Corp.<br/>
                    Intended for MVP Demonstration Only.
                </p>
            </div>
        </div>
    );
};

export default Login;
