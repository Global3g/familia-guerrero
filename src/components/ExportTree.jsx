import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function ExportTree() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      // Find the ReactFlow container
      const container = document.querySelector('.react-flow')
      if (!container) {
        alert('Primero ve a la seccion del Arbol Visual')
        return
      }

      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(container, {
        backgroundColor: '#FEFCF8',
        quality: 1,
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = 'arbol-familia-guerrero.png'
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export error:', err)
      alert('Error al exportar. Intenta de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B8943E] text-white text-sm font-medium hover:bg-[#B8943E]/90 transition shadow-lg disabled:opacity-50"
    >
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? 'Exportando...' : 'Exportar Arbol'}
    </button>
  )
}
