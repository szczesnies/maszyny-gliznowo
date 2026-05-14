'use client'

export default function Toast({ toast }) {
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className={`fixed right-3 top-3 z-50 max-w-sm overflow-hidden rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-black/40 ${isError ? 'border-red-500/30 bg-red-950 text-red-100' : 'border-yellow-500/30 bg-[#181818] text-yellow-100'}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{isError ? 'Błąd' : 'Gotowe'}</p>
      <p className="mt-0.5 break-words font-bold">{toast.message}</p>
      <div className={`absolute inset-x-0 bottom-0 h-0.5 ${isError ? 'bg-red-400' : 'bg-yellow-500'}`} />
    </div>
  )
}

