import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, UserPlus, Gift, Heart, Calendar, Image, Star } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, limit } from 'firebase/firestore'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} hrs`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} dias`
  return date.toLocaleDateString('es-MX')
}

const typeConfig = {
  form_response: { icon: UserPlus, color: '#6B9080', label: 'Nuevo formulario' },
  birthday: { icon: Gift, color: '#B8654A', label: 'Cumpleanos' },
  anniversary: { icon: Heart, color: '#C8846A', label: 'Aniversario' },
  new_photo: { icon: Image, color: '#B8976A', label: 'Nueva foto' },
  new_event: { icon: Calendar, color: '#6B9080', label: 'Nuevo evento' },
  milestone: { icon: Star, color: '#B8654A', label: 'Hito familiar' },
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Listen for form responses (real-time)
    const unsubForm = onSnapshot(
      query(collection(db, 'formResponses'), orderBy('submittedAt', 'desc'), limit(20)),
      (snap) => {
        const formNotifs = snap.docs.map(d => {
          const data = d.data()
          return {
            id: `form-${d.id}`,
            type: 'form_response',
            title: `${data.personName || 'Alguien'} envio su formulario`,
            subtitle: data.parentId ? 'Datos integrados al arbol' : 'Nuevo miembro registrado',
            date: data.submittedAt,
            read: data.notifRead || false,
            docId: d.id,
            collection: 'formResponses',
          }
        })
        updateNotifications(formNotifs)
      }
    )

    // Generate birthday notifications
    generateBirthdayNotifs()

    return () => unsubForm()
  }, [])

  const generateBirthdayNotifs = async () => {
    try {
      const snap = await getDocs(collection(db, 'familyMembers'))
      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()
      const birthdayNotifs = []

      const checkPerson = (person) => {
        if (!person.birthDate) return
        const parts = person.birthDate.split('-')
        if (parts.length < 3) return
        const month = parseInt(parts[1])
        const day = parseInt(parts[2])
        if (month === todayMonth && day === todayDay) {
          const age = today.getFullYear() - parseInt(parts[0])
          birthdayNotifs.push({
            id: `bday-${person.name}`,
            type: 'birthday',
            title: `Hoy cumple anos ${person.name?.split(' ')[0]}!`,
            subtitle: `Cumple ${age} anos`,
            date: today.toISOString(),
            read: false,
          })
        }
        // Check within next 7 days
        for (let d = 1; d <= 7; d++) {
          const future = new Date(today)
          future.setDate(future.getDate() + d)
          if (parseInt(parts[1]) === future.getMonth() + 1 && parseInt(parts[2]) === future.getDate()) {
            const age = future.getFullYear() - parseInt(parts[0])
            birthdayNotifs.push({
              id: `bday-soon-${person.name}`,
              type: 'birthday',
              title: `${person.name?.split(' ')[0]} cumple en ${d} dia${d > 1 ? 's' : ''}`,
              subtitle: `Cumplira ${age} anos`,
              date: future.toISOString(),
              read: false,
            })
          }
        }
        if (person.spouse && typeof person.spouse === 'object') checkPerson(person.spouse)
        if (person.children) person.children.forEach(c => checkPerson(c))
      }

      snap.forEach(d => checkPerson(d.data()))
      updateNotifications(birthdayNotifs, true)
    } catch (e) {
      console.error('Error generating birthday notifs:', e)
    }
  }

  const [formNotifs, setFormNotifs] = useState([])
  const [bdayNotifs, setBdayNotifs] = useState([])

  const updateNotifications = (notifs, isBirthday = false) => {
    if (isBirthday) {
      setBdayNotifs(notifs)
    } else {
      setFormNotifs(notifs)
    }
  }

  useEffect(() => {
    const all = [...formNotifs, ...bdayNotifs].sort((a, b) => new Date(b.date) - new Date(a.date))
    setNotifications(all)
    setUnreadCount(all.filter(n => !n.read).length)
  }, [formNotifs, bdayNotifs])

  const markAllRead = async () => {
    // Mark form responses as read in Firestore
    for (const n of notifications) {
      if (n.collection === 'formResponses' && !n.read) {
        try {
          await updateDoc(doc(db, n.collection, n.docId), { notifRead: true })
        } catch (e) {}
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-colors hover:bg-[#0F172A]/10"
      >
        <Bell className="w-5 h-5" style={{ color: '#FFFFFF' }} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#B8654A] text-white text-[11px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: '#0F172A', border: '1px solid #E2E8F0' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.8)' }}>
                <h3 className="text-sm font-bold" style={{ color: '#FFFFFF' }}>Notificaciones</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-medium px-2 py-1 rounded-full" style={{ color: '#6B9080', backgroundColor: '#6B908015' }}>
                      Marcar leidas
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: '#E2E8F0' }} />
                    <p className="text-xs" style={{ color: '#64748B' }}>Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((notif) => {
                    const config = typeConfig[notif.type] || typeConfig.form_response
                    const Icon = config.icon
                    return (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 px-4 py-3 border-b transition-colors"
                        style={{
                          borderColor: 'rgba(255,255,255,0.8)',
                          backgroundColor: notif.read ? 'transparent' : '#6B908008',
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold leading-tight" style={{ color: '#FFFFFF' }}>
                            {notif.title}
                          </p>
                          {notif.subtitle && (
                            <p className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>{notif.subtitle}</p>
                          )}
                          <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>{timeAgo(notif.date)}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: config.color }} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
