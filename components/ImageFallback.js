'use client'

export default function ImageFallback({ label = 'Brak zdjęcia', className = '' }) {
  return (
    <div className={`flex items-center justify-center bg-[#242424] text-sm font-semibold text-zinc-500 ${className}`}>
      {label}
    </div>
  )
}

