'use client'

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-yellow-500/10 bg-[#181818] shadow-lg shadow-black/20">
      <div className="h-28 animate-pulse bg-[#242424]" />
      <div className="space-y-2.5 p-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#2a2a2a]" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-11 animate-pulse rounded-xl bg-[#222]" />
          <div className="h-11 animate-pulse rounded-xl bg-[#222]" />
          <div className="h-11 animate-pulse rounded-xl bg-yellow-500/30" />
        </div>
        <div className="h-10 animate-pulse rounded-xl bg-[#202020]" />
      </div>
    </div>
  )
}

export default function LoadingState({ text = 'Ładowanie...' }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-white">
      <p className="text-lg font-semibold text-yellow-400">{text}</p>
    </main>
  )
}

