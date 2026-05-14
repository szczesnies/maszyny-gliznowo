'use client'

export default function EmptyState({ title, description, actions }) {
  return (
    <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-[#181818] p-8 text-center shadow-xl shadow-black/25">
      <p className="text-xl font-bold text-white">{title}</p>
      {description && <p className="mt-2 text-sm text-zinc-400">{description}</p>}
      {actions && <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>}
    </div>
  )
}

