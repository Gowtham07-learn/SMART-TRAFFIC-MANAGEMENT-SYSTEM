import React, { useState } from 'react';
import {
    LayoutDashboard,
    Map as MapIcon,
    TrafficCone,
    Ambulance,
    TrendingUp,
    Zap,
    BarChart3,
    Activity,
    ChevronLeft,
    Menu
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { AlertTriangle, Flag, Route, LogOut } from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', allowedRoles: [ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER] },
    { icon: MapIcon, label: 'Live Traffic Map', path: '/map', allowedRoles: [ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER, ROLES.CITIZEN] },
    { icon: TrafficCone, label: 'Signal Control', path: '/signals', allowedRoles: [ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER] },
    { icon: Ambulance, label: 'Emergency Priority', path: '/emergency', allowedRoles: [ROLES.ADMIN, ROLES.EMERGENCY_DRIVER] },
    { icon: TrendingUp, label: 'Traffic Predictions', path: '/predictions', allowedRoles: [ROLES.ADMIN] },
    { icon: Zap, label: 'Digital Twin', path: '/digital-twin', allowedRoles: [ROLES.ADMIN] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', allowedRoles: [ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER] },
    { icon: Activity, label: 'System Health', path: '/health', allowedRoles: [ROLES.ADMIN] },
    
    // Emergency Driver specific routes
    { icon: MapIcon, label: 'Navigation / Route View', path: '/emergency-route', allowedRoles: [ROLES.EMERGENCY_DRIVER] },
    
    // Citizen specific routes
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts', allowedRoles: [ROLES.CITIZEN] },
    { icon: Flag, label: 'Report Incident', path: '/report', allowedRoles: [ROLES.CITIZEN] },
    { icon: Route, label: 'Route Recommendations', path: '/routes', allowedRoles: [ROLES.CITIZEN] },
];

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { role, hasAccess, logout } = useAuth();
    
    const visibleMenuItems = menuItems.filter(item => hasAccess(role, item.allowedRoles));

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? '80px' : '280px' }}
            className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col relative transition-all duration-300 ease-in-out"
        >
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent"
                    >
                        SMART TRAFFIC
                    </motion.h1>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                {visibleMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center p-3 rounded-xl transition-all group",
                            isActive
                                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                        )}
                    >
                        <item.icon size={22} className={cn("min-w-[22px]", isCollapsed ? "mx-auto" : "mr-4")} />
                        {!isCollapsed && (
                            <span className="font-medium whitespace-nowrap">{item.label}</span>
                        )}
                        {isCollapsed && (
                            <div className="absolute left-20 bg-slate-800 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {item.label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 flex flex-col items-center">
                <div className={cn("flex items-center w-full text-slate-400", isCollapsed ? "justify-center mb-4" : "space-x-3 px-2 mb-0")}>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-slate-100 ${
                        role === ROLES.ADMIN ? 'bg-purple-500' : 
                        role === ROLES.TRAFFIC_CONTROLLER ? 'bg-blue-500' :
                        role === ROLES.EMERGENCY_DRIVER ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                        {role?.charAt(0) || 'U'}
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-slate-100 truncate w-32">
                                {role === ROLES.TRAFFIC_CONTROLLER ? 'Controller Unit' : 
                                 role === ROLES.EMERGENCY_DRIVER ? 'Emergency Driver' :
                                 role === ROLES.CITIZEN ? 'Citizen Portal' : 'Admin Panel'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate w-32 uppercase tracking-wider">{role}</span>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={logout}
                    className={cn(
                        "flex items-center justify-center p-2 rounded-lg transition-colors border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 hover:border-red-500/30 w-full",
                        isCollapsed ? "" : "mt-4 space-x-2"
                    )}
                    title="Sign out"
                >
                    <LogOut size={16} />
                    {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                </button>
            </div>
        </motion.div>
    );
};
