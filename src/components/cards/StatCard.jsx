import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export const StatCard = ({ label, value, change, trend }) => {
    return (
        <div className="glass-card p-5 flex flex-col justify-between">
            <span className="text-slate-400 text-sm font-medium">{label}</span>
            <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-bold text-slate-100">{value}</span>
                <div className={cn(
                    "flex items-center text-xs font-semibold px-2 py-1 rounded-full",
                    trend === 'up' ? "text-red-400 bg-red-400/10" :
                        trend === 'down' ? "text-green-400 bg-green-400/10" :
                            "text-slate-400 bg-slate-400/10"
                )}>
                    {trend === 'up' && <ArrowUpRight size={14} className="mr-1" />}
                    {trend === 'down' && <ArrowDownRight size={14} className="mr-1" />}
                    {trend === 'neutral' && <Minus size={14} className="mr-1" />}
                    {change}
                </div>
            </div>
        </div>
    );
};
