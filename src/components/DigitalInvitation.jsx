import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Share2, Copy, Check, Download } from 'lucide-react'

const typeColors = {
  cumpleanos: '#B8963E',
  reunion: '#6B9080',
  boda: '#B8976A',
  aniversario: '#C8846A',
  otro: '#152238',
}

const typeLabels = {
  cumpleanos: 'Cumpleanos',
  reunion: 'Reunion',
  boda: 'Boda',
  aniversario: 'Aniversario',
  otro: 'Otro',
}

const typeEmojis = {
  cumpleanos: '🎂',
  reunion: '👨‍👩‍👧‍👦',
  boda: '💍',
  aniversario: '💕',
  otro: '🎉',
}

const DigitalInvitation = () => {
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    message: '',
    type: 'cumpleanos',
  })
  const [copied, setCopied] = useState(false)

  const typeColor = typeColors[form.type] || typeColors.otro

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const getInvitationText = () => {
    return `Te invitamos: ${form.name}\n${form.date} ${form.time}\n${form.location}\n${form.message}\n\nFamilia Guerrero`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInvitationText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Te invitamos: ${form.name}\n${form.date} ${form.time}\n${form.location}\n${form.message}\n\nFamilia Guerrero`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const generateImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    // gradient background
    const grad = ctx.createLinearGradient(0, 0, 600, 500)
    grad.addColorStop(0, '#F8FAFC')
    grad.addColorStop(1, '#F1F5F9')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 600, 500)
    // top accent bar
    ctx.fillStyle = typeColor
    ctx.fillRect(0, 0, 600, 6)
    // event type emoji
    ctx.font = '40px serif'
    ctx.textAlign = 'center'
    ctx.fillText(typeEmojis[form.type] || '🎉', 300, 70)
    // event name
    ctx.fillStyle = '#152238'
    ctx.font = 'bold 28px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(form.name, 300, 120)
    // date
    ctx.font = '18px Inter, sans-serif'
    ctx.fillStyle = typeColor
    ctx.fillText(form.date + (form.time ? ' · ' + form.time : ''), 300, 160)
    // location
    ctx.fillStyle = '#6B9080'
    ctx.font = '16px Inter, sans-serif'
    ctx.fillText(form.location, 300, 200)
    // message
    ctx.fillStyle = '#152238AA'
    ctx.font = 'italic 14px Georgia, serif'
    // wrap text
    const words = form.message.split(' ')
    let line = ''
    let y = 260
    words.forEach((w) => {
      const test = line + w + ' '
      if (ctx.measureText(test).width > 450) {
        ctx.fillText(line, 300, y)
        y += 22
        line = w + ' '
      } else {
        line = test
      }
    })
    ctx.fillText(line, 300, y)
    // branding
    ctx.fillStyle = '#B8963E60'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Familia Guerrero', 300, 480)
    // download
    const link = document.createElement('a')
    link.download = `invitacion-${form.name.replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-8" style={{ backgroundColor: '#F5F0E8' }}>
      <motion.h2
        className="text-3xl font-serif italic text-center"
        style={{ color: '#1C1C1C' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Crear Invitacion Digital
      </motion.h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 space-y-4"
          style={{ backgroundColor: '#FFFDF7', border: '2px solid rgba(184,150,62,0.3)' }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A4A' }}>
              Tipo de evento
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ border: '1.5px solid rgba(184,150,62,0.3)', backgroundColor: '#F5F0E8', color: '#1C1C1C' }}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {typeEmojis[key]} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A4A' }}>
              Nombre del evento
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Cumpleanos de Abuelita"
              className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ border: '1.5px solid rgba(184,150,62,0.3)', backgroundColor: '#F5F0E8', color: '#1C1C1C' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A4A' }}>
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{ border: '1.5px solid rgba(184,150,62,0.3)', backgroundColor: '#F5F0E8', color: '#1C1C1C' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A4A' }}>
                Hora
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{ border: '1.5px solid rgba(184,150,62,0.3)', backgroundColor: '#F5F0E8', color: '#1C1C1C' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A4A' }}>
              Lugar
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Ej: Casa de los abuelos"
              className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ border: '1.5px solid rgba(184,150,62,0.3)', backgroundColor: '#F5F0E8', color: '#1C1C1C' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A4A' }}>
              Mensaje personal
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Escribe un mensaje especial para la familia..."
              className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none"
              style={{ border: '1.5px solid rgba(184,150,62,0.3)', backgroundColor: '#F5F0E8', color: '#1C1C1C' }}
            />
          </div>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-center" style={{ color: '#8A8A8A' }}>Vista previa</p>

          <div
            className="rounded-2xl shadow-lg overflow-hidden"
            style={{ backgroundColor: '#FFFDF7', border: '2px solid rgba(184,150,62,0.3)' }}
          >
            {/* Top decorative border */}
            <div
              className="h-2"
              style={{
                background: `linear-gradient(90deg, ${typeColor}, ${typeColor}88, ${typeColor})`,
              }}
            />

            <div className="p-8 text-center space-y-4">
              {/* Event type icon */}
              <motion.span
                className="text-4xl block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
              >
                {typeEmojis[form.type] || '🎉'}
              </motion.span>

              {/* Event name */}
              <h3
                className="text-2xl font-serif italic font-bold"
                style={{ color: '#1C1C1C' }}
              >
                {form.name || 'Nombre del evento'}
              </h3>

              {/* Date and time */}
              <div className="flex items-center justify-center gap-2" style={{ color: typeColor }}>
                <Calendar size={16} />
                <span className="text-sm">
                  {form.date || 'Fecha'}
                  {form.time ? ` · ${form.time}` : ''}
                </span>
              </div>

              {/* Location */}
              {(form.location || true) && (
                <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#6B9080' }}>
                  <MapPin size={16} />
                  <span>{form.location || 'Lugar'}</span>
                </div>
              )}

              {/* Message */}
              {form.message && (
                <p
                  className="text-sm italic mt-4 px-4 leading-relaxed"
                  style={{ color: '#4A4A4A' }}
                >
                  {form.message}
                </p>
              )}

              {/* Branding */}
              <p className="text-xs pt-6" style={{ color: 'rgba(184,150,62,0.6)' }}>
                Familia Guerrero
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: copied ? '#6B9080' : '#152238' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </motion.button>

            <motion.button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: '#25D366' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={16} />
              WhatsApp
            </motion.button>

            <motion.button
              onClick={generateImage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: typeColor }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              Imagen
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DigitalInvitation
