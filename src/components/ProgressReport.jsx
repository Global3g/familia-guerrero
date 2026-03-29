import { useState } from 'react'
import { FileDown, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

function checkPerson(person, role) {
  const fields = {
    nombre: !!(person.name || person.fullName),
    foto: !!person.photoURL,
    nacimiento: !!person.birthDate,
    genero: !!person.gender,
    bio: !!person.bio,
    ubicacion: !!person.location || !!person.birthPlace,
  }
  const filled = Object.values(fields).filter(Boolean).length
  const total = Object.keys(fields).length
  return {
    name: person.fullName || person.name || '(sin nombre)',
    role,
    fields,
    filled,
    total,
    percent: Math.round((filled / total) * 100),
  }
}

function walkTree(members) {
  const report = []

  members.forEach(member => {
    // Hijo directo
    report.push(checkPerson(member, 'Hijo/a'))

    // Esposa del hijo
    if (member.spouse && typeof member.spouse === 'object') {
      report.push(checkPerson(member.spouse, `Esposo/a de ${(member.name || '').split(' ')[0]}`))
    }

    // Nietos
    ;(member.children || []).forEach(child => {
      report.push(checkPerson(child, `Nieto/a (hijo de ${(member.name || '').split(' ')[0]})`))

      if (child.spouse && typeof child.spouse === 'object') {
        report.push(checkPerson(child.spouse, `Esposo/a de ${(child.name || '').split(' ')[0]}`))
      }

      // Bisnietos
      ;(child.children || []).forEach(gc => {
        report.push(checkPerson(gc, `Bisnieto/a (hijo de ${(child.name || '').split(' ')[0]})`))

        if (gc.spouse && typeof gc.spouse === 'object') {
          report.push(checkPerson(gc.spouse, `Esposo/a de ${(gc.name || '').split(' ')[0]}`))
        }

        // Tataranietos
        ;(gc.children || []).forEach(ggc => {
          report.push(checkPerson(ggc, `Tataranieto/a (hijo de ${(gc.name || '').split(' ')[0]})`))
        })
      })
    })
  })

  return report
}

export default function ProgressReport() {
  const [loading, setLoading] = useState(false)

  const generatePDF = async () => {
    setLoading(true)
    try {
      const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
      const { jsPDF } = await import('jspdf')

      const doc = new jsPDF('p', 'mm', 'letter')
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const marginL = 15
      const marginR = 15
      const contentW = pageW - marginL - marginR
      let y = 15

      const checkPage = (needed) => {
        if (y + needed > pageH - 15) {
          doc.addPage()
          y = 15
        }
      }

      // ── Header ────────────────────────────────────
      doc.setFillColor(93, 64, 55) // #0F172A
      doc.rect(0, 0, pageW, 32, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Familia Guerrero - Avance de Informacion', pageW / 2, 14, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.text(`Reporte generado: ${today}`, pageW / 2, 22, { align: 'center' })
      y = 40

      // ── Grandparents summary ──────────────────────
      doc.setTextColor(184, 148, 62) // #B8976A
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Abuelos', marginL, y)
      y += 7

      const gpNames = []
      if (gp?.grandfather) gpNames.push(checkPerson(gp.grandfather, 'Abuelo'))
      if (gp?.grandmother) gpNames.push(checkPerson(gp.grandmother, 'Abuela'))

      gpNames.forEach(p => {
        drawPersonRow(doc, p, marginL, y, contentW)
        y += 10
      })
      y += 5

      // ── Walk all members ──────────────────────────
      const report = walkTree(members)

      // Summary counts
      const complete = report.filter(r => r.percent === 100).length
      const partial = report.filter(r => r.percent > 0 && r.percent < 100).length
      const empty = report.filter(r => r.percent === 0).length

      // ── Summary box ───────────────────────────────
      checkPage(30)
      doc.setFillColor(250, 246, 238) // #F1F5F9
      doc.roundedRect(marginL, y, contentW, 22, 3, 3, 'F')
      doc.setTextColor(93, 64, 55)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumen General', marginL + 5, y + 7)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(122, 158, 126) // green
      doc.text(`Completos: ${complete}`, marginL + 5, y + 15)
      doc.setTextColor(196, 112, 75) // orange
      doc.text(`Parciales: ${partial}`, marginL + 60, y + 15)
      doc.setTextColor(180, 60, 60) // red
      doc.text(`Sin info: ${empty}`, marginL + 115, y + 15)
      doc.setTextColor(93, 64, 55)
      doc.text(`Total: ${report.length} personas`, marginL + 155, y + 15)
      y += 30

      // ── Detailed list ─────────────────────────────
      doc.setTextColor(93, 64, 55)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Detalle por Persona', marginL, y)
      y += 8

      // Table header
      checkPage(10)
      doc.setFillColor(93, 64, 55)
      doc.rect(marginL, y, contentW, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('Nombre', marginL + 2, y + 5)
      doc.text('Rol', marginL + 62, y + 5)
      doc.text('Foto', marginL + 115, y + 5)
      doc.text('Nacim.', marginL + 130, y + 5)
      doc.text('Bio', marginL + 148, y + 5)
      doc.text('Avance', marginL + 162, y + 5)
      y += 9

      report.forEach((p, i) => {
        checkPage(8)
        // Alternate row bg
        if (i % 2 === 0) {
          doc.setFillColor(250, 246, 238)
          doc.rect(marginL, y - 3.5, contentW, 7, 'F')
        }

        doc.setTextColor(93, 64, 55)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')

        // Name (truncate if long)
        const displayName = p.name.length > 28 ? p.name.substring(0, 26) + '...' : p.name
        doc.text(displayName, marginL + 2, y)

        // Role (truncate)
        doc.setTextColor(120, 120, 120)
        const displayRole = p.role.length > 24 ? p.role.substring(0, 22) + '...' : p.role
        doc.text(displayRole, marginL + 62, y)

        // Status icons as text
        const checkMark = (val, x) => {
          if (val) {
            doc.setTextColor(122, 158, 126)
            doc.text('Si', x, y)
          } else {
            doc.setTextColor(200, 80, 80)
            doc.setFont('helvetica', 'bold')
            doc.text('FALTA', x, y)
            doc.setFont('helvetica', 'normal')
          }
        }

        checkMark(p.fields.foto, marginL + 115)
        checkMark(p.fields.nacimiento, marginL + 130)
        checkMark(p.fields.bio, marginL + 148)

        // Percentage
        if (p.percent === 100) {
          doc.setTextColor(122, 158, 126)
          doc.setFont('helvetica', 'bold')
        } else if (p.percent >= 50) {
          doc.setTextColor(184, 148, 62)
          doc.setFont('helvetica', 'bold')
        } else {
          doc.setTextColor(200, 80, 80)
          doc.setFont('helvetica', 'bold')
        }
        doc.text(`${p.percent}%`, marginL + 164, y)

        y += 7
      })

      // ── Footer ────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(`Pagina ${i} de ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' })
        doc.text('Familia Guerrero', marginL, pageH - 8)
      }

      doc.save('Avance_Familia_Guerrero.pdf')
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Error al generar el PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
      style={{
        backgroundColor: loading ? '#0F172A30' : '#0F172A15',
        color: '#FFFFFF',
      }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {loading ? 'Generando...' : 'Descargar avance (PDF)'}
    </button>
  )
}

function drawPersonRow(doc, p, x, y, w) {
  doc.setFillColor(250, 246, 238)
  doc.roundedRect(x, y - 4, w, 9, 2, 2, 'F')
  doc.setTextColor(93, 64, 55)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(p.name, x + 3, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(`(${p.role})`, x + 3 + doc.getTextWidth(p.name) + 3, y)

  // Percent bar
  const barX = x + w - 50
  const barW = 40
  doc.setFillColor(230, 230, 230)
  doc.roundedRect(barX, y - 3, barW, 4, 1, 1, 'F')
  if (p.percent > 0) {
    const fillW = (barW * p.percent) / 100
    if (p.percent === 100) doc.setFillColor(122, 158, 126)
    else if (p.percent >= 50) doc.setFillColor(184, 148, 62)
    else doc.setFillColor(196, 112, 75)
    doc.roundedRect(barX, y - 3, fillW, 4, 1, 1, 'F')
  }
  doc.setFontSize(7)
  doc.setTextColor(93, 64, 55)
  doc.text(`${p.percent}%`, barX + barW + 2, y)
}
