import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X } from 'lucide-react'
import { db, auth } from '../firebase/config'
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore'

export function ChatButton({ onClick, unread }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#C4704B] text-white shadow-xl hover:bg-[#C4704B]/90 transition flex items-center justify-center"
    >
      <MessageCircle className="w-6 h-6" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  )
}

export default function FamilyChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const q = query(
      collection(db, 'familyChat'),
      orderBy('timestamp', 'asc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMessages(msgs)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text) return

    const user = auth.currentUser
    if (!user) return

    setNewMessage('')

    await addDoc(collection(db, 'familyChat'), {
      text,
      author: user.displayName || 'Anon',
      authorEmail: user.email || '',
      timestamp: new Date(),
      photoURL: user.photoURL || '',
    })
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const currentEmail = auth.currentUser?.email

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 600, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 600, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] bg-[#FFF8F0] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#5D4037] text-white px-4 py-3 flex items-center justify-between rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-lg">Chat Familiar</span>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.authorEmail === currentEmail
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 ${
                      isOwn
                        ? 'bg-[#C4704B]/10 rounded-br-sm'
                        : 'bg-white rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-[#5D4037] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {msg.author?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs font-semibold text-[#5D4037]">
                          {msg.author}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-800 break-words">
                      {msg.text}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn ? 'text-right' : 'text-left'
                      } text-gray-400`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="shrink-0 border-t border-gray-200 px-3 py-2 flex items-center gap-2 bg-white"
          >
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[#C4704B] bg-[#FFF8F0]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-9 h-9 rounded-full bg-[#C4704B] text-white flex items-center justify-center hover:bg-[#C4704B]/90 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
