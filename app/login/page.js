'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle =
  'w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-4 py-3 text-[15px] font-medium text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-yellow-500/60 focus:bg-[#222] focus:ring-2 focus:ring-yellow-500/10'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setErrorMessage('')
    setLoading(true)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)

    if (!response.ok) {
      setErrorMessage('Nieprawidłowy email lub hasło')
      return
    }

    router.push('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-yellow-500/15 bg-[#171717] p-6 shadow-xl shadow-black/35 sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <img src="/icon-192.png" alt="Maszyny Gliznowo" className="mb-4 h-20 w-20 rounded-2xl border border-yellow-500/20 shadow-lg shadow-black/25" />
          <h1 className="text-[28px] font-semibold leading-tight text-white">Maszyny Gliznowo</h1>
          <p className="mt-2 text-[13px] font-semibold text-yellow-400">Wewnętrzny system magazynowy</p>
        </div>

        <div className="space-y-3">
          <input className={inputStyle} placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className={inputStyle} placeholder="Hasło" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

          {errorMessage && <p className="rounded-2xl border border-red-500/30 bg-red-950/50 p-3 text-center text-sm font-semibold text-red-200">{errorMessage}</p>}

          <button onClick={login} disabled={loading} className="w-full rounded-xl bg-yellow-500 p-3 text-[14px] font-bold text-black transition hover:bg-yellow-400 hover:shadow-md hover:shadow-yellow-950/30 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'LOGOWANIE...' : 'ZALOGUJ'}
          </button>
        </div>

        <p className="mt-6 text-center text-[12px] text-zinc-500">Dostęp tylko dla uprawnionych użytkowników</p>
      </div>
    </main>
  )
}

