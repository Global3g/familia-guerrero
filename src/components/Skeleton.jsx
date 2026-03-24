import React from 'react'

// Base shimmer animation
export function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse bg-[#E0D5C8]/40 rounded ${className}`} />
}

// Card skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E0D5C8]/30 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-3/4 rounded-lg" />
          <SkeletonPulse className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <SkeletonPulse className="h-3 w-full rounded-lg" />
      <SkeletonPulse className="h-3 w-2/3 rounded-lg" />
    </div>
  )
}

// Grid of card skeletons
export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Timeline skeleton
export function SkeletonTimeline({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <SkeletonPulse className="w-3 h-3 rounded-full" />
            {i < count - 1 && (
              <SkeletonPulse className="w-0.5 h-16 rounded-full mt-1" />
            )}
          </div>
          <div className="flex-1 space-y-2 pb-4">
            <SkeletonPulse className="h-4 w-1/3 rounded-lg" />
            <SkeletonPulse className="h-3 w-full rounded-lg" />
            <SkeletonPulse className="h-3 w-4/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Photo grid skeleton
export function SkeletonGallery({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  )
}

// Stats skeleton
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-4 border border-[#E0D5C8]/30 space-y-3 flex flex-col items-center"
        >
          <SkeletonPulse className="w-10 h-10 rounded-full" />
          <SkeletonPulse className="h-6 w-16 rounded-lg" />
          <SkeletonPulse className="h-3 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
