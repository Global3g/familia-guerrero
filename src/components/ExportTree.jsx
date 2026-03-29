import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

export default function ExportTree() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])

      const canvas = document.createElement('canvas')
      const padding = 60
      const nodeW = 180
      const nodeH = 60
      const gapX = 30
      const gapY = 100

      // Calculate dimensions
      const totalMembers = members.length
      const canvasW = Math.max(800, totalMembers * (nodeW + gapX) + padding * 2)
      const canvasH = 600
      canvas.width = canvasW
      canvas.height = canvasH

      const ctx = canvas.getContext('2d')

      // Background
      ctx.fillStyle = '#F8FAFC'
      ctx.fillRect(0, 0, canvasW, canvasH)

      // Title
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 32px Georgia, serif'
      ctx.textAlign = 'center'
      ctx.fillText('Familia Guerrero', canvasW / 2, 50)

      // Grandparents
      const gpName = gp?.grandfather?.fullName || gp?.grandfather?.name || 'Abuelo'
      const gmName = gp?.grandmother?.fullName || gp?.grandmother?.name || 'Abuela'

      const gpX = canvasW / 2 - nodeW - 20
      const gmX = canvasW / 2 + 20
      const gpY = 80

      // Draw grandparent nodes
      const drawNode = (x, y, name, color) => {
        ctx.fillStyle = color + '20'
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(x, y, nodeW, nodeH, 12)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#0F172A'
        ctx.font = 'bold 14px Inter, sans-serif'
        ctx.textAlign = 'center'
        const shortName = name.length > 22 ? name.substring(0, 20) + '...' : name
        ctx.fillText(shortName, x + nodeW / 2, y + nodeH / 2 + 5)
      }

      drawNode(gpX, gpY, gpName, '#B8976A')
      drawNode(gmX, gpY, gmName, '#B8976A')

      // Heart between grandparents
      ctx.fillStyle = '#B8654A'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('❤', canvasW / 2, gpY + nodeH / 2 + 7)

      // Line down from grandparents
      ctx.strokeStyle = '#B8654A80'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(canvasW / 2, gpY + nodeH)
      ctx.lineTo(canvasW / 2, gpY + nodeH + 30)
      ctx.stroke()

      // Horizontal line
      const childrenY = gpY + nodeH + gapY
      const totalW = totalMembers * (nodeW + gapX) - gapX
      const startX = (canvasW - totalW) / 2

      ctx.beginPath()
      ctx.moveTo(startX + nodeW / 2, gpY + nodeH + 30)
      ctx.lineTo(startX + totalW - nodeW / 2, gpY + nodeH + 30)
      ctx.stroke()

      // Draw each member
      members.forEach((m, i) => {
        const x = startX + i * (nodeW + gapX)
        const color = i % 2 === 0 ? '#6B9080' : '#B8654A'

        // Vertical tick
        ctx.beginPath()
        ctx.moveTo(x + nodeW / 2, gpY + nodeH + 30)
        ctx.lineTo(x + nodeW / 2, childrenY)
        ctx.stroke()

        drawNode(x, childrenY, m.name, color)

        // Children count
        const kidCount = (m.children || []).length
        if (kidCount > 0) {
          ctx.fillStyle = '#B8976A'
          ctx.font = '11px Inter, sans-serif'
          ctx.fillText(kidCount + ' hijos', x + nodeW / 2, childrenY + nodeH + 15)
        }
      })

      // Watermark
      ctx.fillStyle = '#0F172A40'
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('familia-guerrero.vercel.app', canvasW / 2, canvasH - 15)

      // Download
      const link = document.createElement('a')
      link.download = 'arbol-familia-guerrero.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export error:', err)
      alert('Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B8976A] text-white text-sm font-medium hover:bg-[#B8976A]/90 transition shadow-lg disabled:opacity-50">
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? 'Exportando...' : 'Exportar Arbol'}
    </button>
  )
}
