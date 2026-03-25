import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const DashboardLayout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Topbar />

                <main className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="max-w-[1600px] mx-auto"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};
