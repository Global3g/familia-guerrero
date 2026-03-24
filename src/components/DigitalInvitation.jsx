import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Share2, Copy, Check, Download } from 'lucide-react'

const typeColors = {
  cumpleanos: '#C4704B',
  reunion: '#7A9E7E',
  boda: '#B8943E',
  aniversario: '#E8956D',
  otro: '#5D4037',
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
    grad.addColorStop(0, '#FDF8F0')
    grad.addColorStop(1, '#FDEBD3')
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
    ctx.fillStyle = '#5D4037'
    ctx.font = 'bold 28px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(form.name, 300, 120)
    // date
    ctx.font = '18px Inter, sans-serif'
    ctx.fillStyle = typeColor
    ctx.fillText(form.date + (form.time ? ' · ' + form.time : ''), 300, 160)
    // location
    ctx.fillStyle = '#7A9E7E'
    ctx.font = '16px Inter, sans-serif'
    ctx.fillText(form.location, 300, 200)
    // message
    ctx.fillStyle = '#5D4037AA'
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
    ctx.fillStyle = '#C4704B60'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Familia Guerrero', 300, 480)
    // download
    const link = document.createElement('a')
    link.download = `invitacion-${form.name.replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <motion.h2
        className="text-3xl font-serif text-center"
        style={{ color: '#5D4037' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Crear Invitacion Digital
      </motion.h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de evento
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ focusRingColor: typeColor }}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {typeEmojis[key]} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del evento
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Cumpleanos de Abuelita"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lugar
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Ej: Casa de los abuelos"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje personal
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Escribe un mensaje especial para la familia..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none"
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
          <p className="text-sm text-gray-500 text-center">Vista previa</p>

          <div
            className="rounded-2xl shadow-lg overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #FDF8F0, #FDEBD3)' }}
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
                className="text-2xl font-serif font-bold"
                style={{ color: '#5D4037' }}
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
                <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#7A9E7E' }}>
                  <MapPin size={16} />
                  <span>{form.location || 'Lugar'}</span>
                </div>
              )}

              {/* Message */}
              {form.message && (
                <p
                  className="text-sm italic mt-4 px-4 leading-relaxed"
                  style={{ color: '#5D4037AA' }}
                >
                  {form.message}
                </p>
              )}

              {/* Branding */}
              <p className="text-xs pt-6" style={{ color: '#C4704B60' }}>
                Familia Guerrero
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: copied ? '#7A9E7E' : '#5D4037' }}
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
