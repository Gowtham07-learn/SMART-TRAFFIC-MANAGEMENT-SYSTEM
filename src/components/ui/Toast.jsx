// src/components/ui/Toast.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let _setToast = null;

export function showToast(message, type = 'success') {
  _setToast?.({ message, type, id: Date.now() });
}

export function ToastProvider() {
  const [toast, setToast] = useState(null);
  _setToast = setToast;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white font-medium shadow-xl ${colors[toast.type]}`}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
