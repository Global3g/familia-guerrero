import { useState } from 'react'
import { motion } from 'framer-motion'
import { Share2, Copy, Check, Link, QrCode, Download } from 'lucide-react'

function QRCode({ url, size = 150 }) {
  // Simple QR-like visual using CSS grid pattern
  const hash = url.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  const cells = Array.from({ length: 121 }, (_, i) => {
    const row = Math.floor(i / 11)
    const col = i % 11
    // Fixed corners (finder patterns)
    if ((row < 3 && col < 3) || (row < 3 && col > 7) || (row > 7 && col < 3)) return true
    // Pseudo-random based on URL hash
    return ((hash * (i + 1) * 7) % 13) > 5
  })
  return (
    <div style={{ width: size, height: size, padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 1, width: '100%', height: '100%' }}>
        {cells.map((filled, i) => (
          <div key={i} style={{ backgroundColor: filled ? '#0F172A' : 'transparent', borderRadius: 1 }} />
        ))}
      </div>
    </div>
  )
}

const FORMULARIO_URL = 'https://familia-guerrero.vercel.app/formulario.html'
const PAGE_URL = 'https://familia-guerrero.vercel.app'
const WHATSAPP_MESSAGE = `Hola familia! Ayudanos a completar nuestro arbol familiar. Llena este formulario: ${FORMULARIO_URL}`

function ShareExport() {
  const [copiedId, setCopiedId] = useState(null)

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const openWhatsApp = () => {
    const encoded = encodeURIComponent(WHATSAPP_MESSAGE)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const cards = [
    {
      id: 'formulario',
      icon: Copy,
      title: 'Link del Formulario',
      description: 'Comparte el formulario para que la familia agregue sus datos al arbol.',
      action: () => copyToClipboard(FORMULARIO_URL, 'formulario'),
      buttonLabel: 'Copiar Link',
      color: '#B8654A',
    },
    {
      id: 'pagina',
      icon: Link,
      title: 'Link de la Pagina',
      description: 'Comparte la pagina principal del arbol familiar Guerrero.',
      action: () => copyToClipboard(PAGE_URL, 'pagina'),
      buttonLabel: 'Copiar Link',
      color: '#6B9080',
    },
    {
      id: 'whatsapp',
      icon: Share2,
      title: 'Compartir por WhatsApp',
      description: 'Envia un mensaje listo con el link del formulario a tu familia.',
      action: openWhatsApp,
      buttonLabel: 'Abrir WhatsApp',
      color: '#25D366',
    },
    {
      id: 'qr',
      icon: QrCode,
      title: 'Codigo QR',
      description: 'Muestra el link del formulario para compartirlo visualmente.',
      action: () => copyToClipboard(FORMULARIO_URL, 'qr'),
      buttonLabel: 'Copiar Link',
      color: '#B8976A',
      isQR: true,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section
      style={{
        padding: '3rem 1rem',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: '0.5rem',
        }}
      >
        Comparte con la Familia
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '2.5rem',
          fontSize: '1.05rem',
        }}
      >
        Invita a tus familiares a participar en el arbol Guerrero.
      </motion.p>

      {/* Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon
          const isCopied = copiedId === card.id

          return (
            <motion.div
              key={card.id}
              variants={cardVariants}
              whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '1.75rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '4px solid rgba(255,255,255,0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'default',
                transition: 'box-shadow 0.3s',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${card.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color={card.color} />
              </div>

              {/* Text */}
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  margin: 0,
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: '1.5',
                  margin: 0,
                  flex: 1,
                }}
              >
                {card.description}
              </p>

              {/* QR Code */}
              {card.isQR && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  <QRCode url="https://familia-guerrero.vercel.app/formulario.html" />
                </div>
              )}

              {/* Action Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={card.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isCopied ? '#6B9080' : card.color,
                  color: '#FFF',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background 0.25s',
                }}
              >
                {isCopied ? (
                  <>
                    <Check size={16} />
                    Copiado!
                  </>
                ) : (
                  card.buttonLabel
                )}
              </motion.button>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Toast notification */}
      {copiedId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0F172A',
            color: '#FFF',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Check size={16} />
          Link copiado al portapapeles
        </motion.div>
      )}
    </section>
  )
}

export default ShareExport
