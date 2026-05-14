import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-5 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-yellow-500/25 bg-[#181818] p-6 text-center shadow-2xl shadow-black/40">
        <p className="text-[12px] font-bold uppercase text-yellow-400">Nie znaleziono</p>
        <h1 className="mt-2 text-2xl font-semibold">Ta strona nie istnieje.</h1>
        <p className="mt-2 text-sm text-zinc-400">Wróć do magazynu i wybierz maszynę z listy.</p>
        <Link href="/" className="mt-5 inline-flex rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-400">WRÓĆ</Link>
      </div>
    </main>
  )
}

