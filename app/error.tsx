'use client'

import Button from '../components/Button'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-5 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#181818] p-6 text-center shadow-2xl shadow-black/40">
        <p className="text-[12px] font-bold uppercase text-red-300">Błąd aplikacji</p>
        <h1 className="mt-2 text-2xl font-semibold">Coś poszło nie tak.</h1>
        <p className="mt-2 text-sm text-zinc-400">Odśwież widok albo spróbuj ponownie za chwilę.</p>
        <Button onClick={reset} variant="primary" className="mt-5">SPRÓBUJ PONOWNIE</Button>
      </div>
    </main>
  )
}
