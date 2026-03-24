import { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext()

export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
                toast.type === 'success' ? 'bg-[#7A9E7E] text-white' :
                toast.type === 'error' ? 'bg-red-500 text-white' :
                'bg-[#B8943E] text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
