'use client'

export default function Modal({ children, onClose, title, tone = 'yellow' }) {
  const border = tone === 'red' ? 'border-red-500/30' : 'border-yellow-500/25'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-lg overflow-hidden rounded-2xl border ${border} bg-[#181818] shadow-2xl shadow-black/50`} onClick={(event) => event.stopPropagation()}>
        {title && (
          <div className={`border-b ${tone === 'red' ? 'border-red-500/20' : 'border-yellow-500/15'} p-4`}>
            <h2 className="break-words text-xl font-semibold text-white">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

