import React, { createContext, useContext, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  } | null>(null);

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    setModalState({
      isOpen: true,
      options,
    });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    if (resolverRef.current) {
      resolverRef.current(true);
    }
    setModalState(null);
  };

  const handleCancel = () => {
    if (resolverRef.current) {
      resolverRef.current(false);
    }
    setModalState(null);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {modalState?.isOpen && (
          <motion.div 
            id="confirmation-modal-portal"
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop with elegant fade and blur */}
            <motion.div 
              id="confirmation-modal-backdrop"
              variants={{
                hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
                visible: { opacity: 1, backdropFilter: 'blur(12px)', transition: { duration: 0.3 } },
                exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.25 } }
              }}
              className="absolute inset-0 bg-kava-bg/85" 
              onClick={handleCancel}
            />

            {/* Modal Dialog Card with spring physics and tiny tilt */}
            <motion.div 
              id="confirmation-modal-card"
              variants={{
                hidden: { scale: 0.92, opacity: 0, y: 25, rotate: -1 },
                visible: { 
                  scale: 1, 
                  opacity: 1, 
                  y: 0, 
                  rotate: 0,
                  transition: { 
                    type: 'spring', 
                    damping: 24, 
                    stiffness: 320, 
                    mass: 0.9,
                    staggerChildren: 0.06,
                    delayChildren: 0.05
                  } 
                },
                exit: { 
                  scale: 0.94, 
                  opacity: 0, 
                  y: 15,
                  rotate: 0.5,
                  transition: { 
                    duration: 0.2,
                    ease: [0.4, 0, 1, 1]
                  } 
                }
              }}
              className="relative bg-[#1c1a16] text-kava-text rounded-[40px] border-2 border-kava-gold/20 shadow-2xl w-full max-w-sm p-10 overflow-hidden"
            >
              {/* Top Accent line representing active status */}
              <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${
                modalState.options.isDanger 
                  ? 'from-rose-500/20 via-rose-500 to-rose-500/20' 
                  : 'from-emerald-500/20 via-emerald-500 to-emerald-500/20'
              }`} />
              
              {/* Status Shield Icon */}
              <motion.div 
                id="confirmation-modal-status-icon"
                variants={{
                  hidden: { opacity: 0, scale: 0.5 },
                  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } },
                  exit: { opacity: 0, scale: 0.8 }
                }}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
                  modalState.options.isDanger 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-rose-500/5' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5'
                }`}
              >
                <Shield size={32} />
              </motion.div>

              {/* Title */}
              <motion.h3 
                id="confirmation-modal-title"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
                  exit: { opacity: 0, y: -4 }
                }}
                className="font-bebas text-3.5xl text-kava-text tracking-tight uppercase leading-none mb-3"
              >
                {modalState.options.title}
              </motion.h3>

              {/* Message */}
              <motion.p 
                id="confirmation-modal-description"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
                  exit: { opacity: 0, y: -4 }
                }}
                className="text-kava-muted text-xs font-semibold leading-relaxed mb-8"
              >
                {modalState.options.message}
              </motion.p>

              {/* Direct Action Buttons */}
              <motion.div 
                id="confirmation-modal-action-row"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
                  exit: { opacity: 0, y: -4 }
                }}
                className="flex gap-3"
              >
                <button 
                  id="confirmation-modal-btn-cancel"
                  onClick={handleCancel}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-kava-muted hover:text-kava-text font-black text-[10px] uppercase tracking-widest hover:bg-white/10 border border-white/5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {modalState.options.cancelText || 'Cancel'}
                </button>
                <button 
                  id="confirmation-modal-btn-confirm"
                  onClick={handleConfirm}
                  className={`flex-1 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-transform active:scale-95 cursor-pointer ${
                    modalState.options.isDanger 
                      ? 'bg-rose-500 shadow-rose-500/10 hover:bg-rose-600' 
                      : 'bg-emerald-500 shadow-emerald-500/10 hover:bg-emerald-600'
                  }`}
                >
                  {modalState.options.confirmText || 'Confirm'}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmationContext.Provider>
  );
};
