import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, Check, X, RotateCw } from 'lucide-react'

function createCroppedImage(imageSrc, pixelCrop) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.92)
    }
    image.crossOrigin = 'anonymous'
    image.src = imageSrc
  })
}

export default function ImageCropper({ isOpen, imageSrc, onComplete, onCancel, cropShape = 'round' }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    const blob = await createCroppedImage(imageSrc, croppedAreaPixels)
    const file = new File([blob], `crop-${Date.now()}.jpg`, { type: 'image/jpeg' })
    onComplete(file)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/90" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/50">
            <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition text-sm">
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <p className="text-white/70 text-sm font-medium">Ajusta la foto</p>
            <button onClick={handleConfirm} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#7A9E7E] text-white hover:bg-[#7A9E7E]/90 transition text-sm font-medium">
              <Check className="w-4 h-4" />
              Listo
            </button>
          </div>

          {/* Cropper area */}
          <div className="relative flex-1 z-10">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="relative z-10 flex items-center justify-center gap-6 px-4 py-4 bg-black/50">
            <button onClick={() => setZoom(z => Math.max(1, z - 0.2))} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
              <ZoomOut className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <ZoomOut className="w-4 h-4 text-white/50" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none bg-white/20 accent-[#7A9E7E]"
              />
              <ZoomIn className="w-4 h-4 text-white/50" />
            </div>

            <button onClick={() => setRotation(r => (r + 90) % 360)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
