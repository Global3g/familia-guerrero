import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'

export default function ShareableCard({ person, onClose }) {
  const [generating, setGenerating] = useState(false)

  const generateCard = async () => {
    setGenerating(true)
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 400
    const ctx = canvas.getContext('2d')

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 600, 400)
    gradient.addColorStop(0, '#FDF8F0')
    gradient.addColorStop(1, '#FDEBD3')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 600, 400)

    // Decorative line
    ctx.fillStyle = '#C4704B'
    ctx.fillRect(0, 0, 600, 4)

    // Name
    ctx.fillStyle = '#5D4037'
    ctx.font = 'bold 28px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(person.name || 'Familia Guerrero', 300, 180)

    // Nickname
    if (person.nickname) {
      ctx.fillStyle = '#C4704B'
      ctx.font = 'italic 18px Georgia, serif'
      ctx.fillText(`"${person.nickname}"`, 300, 210)
    }

    // Details
    ctx.fillStyle = '#5D4037AA'
    ctx.font = '14px Inter, sans-serif'
    let y = 250
    if (person.birthDate) { ctx.fillText(person.birthDate, 300, y); y += 25 }
    if (person.location) { ctx.fillText(person.location, 300, y); y += 25 }

    // Branding
    ctx.fillStyle = '#C4704B60'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Familia Guerrero', 300, 380)

    const link = document.createElement('a')
    link.download = `${(person.name || 'familia').replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setGenerating(false)
  }

  return (
    <button
      onClick={generateCard}
      disabled={generating}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8943E]/10 text-[#B8943E] text-xs font-medium hover:bg-[#B8943E]/20 transition"
    >
      <Share2 className="w-3.5 h-3.5" />
      {generating ? 'Generando...' : 'Compartir tarjeta'}
    </button>
  )
}
