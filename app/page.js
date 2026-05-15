'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { logError } from '../lib/logger'
import { compressImageFiles } from '../lib/imageCompression'

const inputStyle =
  'w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-[14px] font-medium text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-yellow-500/60 focus:bg-[#222] focus:ring-2 focus:ring-yellow-500/10'

const selectStyle = `${inputStyle} appearance-none`
const preferencesKey = 'maszyny-gliznowo-home-preferences'

function loadHomePreferences() {
  if (typeof window === 'undefined') return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(preferencesKey) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    try {
      window.localStorage.removeItem(preferencesKey)
    } catch {}
    return {}
  }
}

function formatPrice(value) {
  if (!value) return '-'
  return `${value} zł`
}

function priceLabel(value) {
  return value ? String(value) + ' z\u0142' : '-'
}

function quickEditHistoryDetails(machine, updates) {
  const changes = [
    ['Nazwa', machine.name, updates.name],
    ['Indeks', machine.index_number, updates.index_number],
    ['Cena zakupu', machine.purchase_price, updates.purchase_price],
    ['VAT', machine.vat_price, updates.vat_price],
    ['Cena', machine.gross_price, updates.gross_price],
  ]
    .filter(([, before, after]) => String(before || '') !== String(after || ''))
    .map(([label, before, after]) => {
      const isPrice = ['Cena zakupu', 'VAT', 'Cena'].includes(label)
      const oldValue = isPrice ? priceLabel(before) : before || '-'
      const newValue = isPrice ? priceLabel(after) : after || '-'
      return `${label} zmieniono z ${oldValue} na ${newValue}.`
    })

  if (String(machine.note || '') !== String(updates.note || '')) {
    changes.push('Notatka zosta\u0142a zaktualizowana.')
  }

  return changes.length > 0 ? changes.join('\n') : 'Zapisano bez zmian w cenach i notatce.'
}
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-yellow-500/10 bg-[#181818] shadow-lg shadow-black/20">
      <div className="h-36 animate-pulse bg-[#242424]" />
      <div className="space-y-3 p-3.5">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#2a2a2a]" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-12 animate-pulse rounded-xl bg-[#222]" />
          <div className="h-12 animate-pulse rounded-xl bg-[#222]" />
          <div className="h-12 animate-pulse rounded-xl bg-yellow-500/30" />
        </div>
        <div className="h-12 animate-pulse rounded-xl bg-[#202020]" />
      </div>
    </div>
  )
}

function priceNumber(value) {
  const number = Number(String(value || '').replace(',', '.').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? number : 0
}

function thumbnailUrl(url, width = 520, height = 300) {
  if (!url || !url.includes('/storage/v1/object/public/')) return url
  return url
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    .concat(url.includes('?') ? '&' : '?', `width=${width}&height=${height}&resize=cover&quality=70`)
}

export default function Home() {
  const router = useRouter()
  const savedPreferences = useMemo(loadHomePreferences, [])
  const [machines, setMachines] = useState([])
  const [name, setName] = useState('')
  const [indexNumber, setIndexNumber] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [grossPrice, setGrossPrice] = useState('')
  const [vatPrice, setVatPrice] = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [images, setImages] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [listMode, setListMode] = useState('table')
  const [view, setView] = useState(savedPreferences.view || 'active')
  const [search, setSearch] = useState(savedPreferences.search || '')
  const [searchPrice, setSearchPrice] = useState(savedPreferences.searchPrice || '')
  const [sortMode, setSortMode] = useState(savedPreferences.sortMode || 'newest')
  const [qualityFilter, setQualityFilter] = useState(savedPreferences.qualityFilter || 'all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [machinesLoading, setMachinesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [quickEditId, setQuickEditId] = useState(null)
  const [quickName, setQuickName] = useState('')
  const [quickIndexNumber, setQuickIndexNumber] = useState('')
  const [quickPurchasePrice, setQuickPurchasePrice] = useState('')
  const [quickVatPrice, setQuickVatPrice] = useState('')
  const [quickGrossPrice, setQuickGrossPrice] = useState('')
  const [quickNote, setQuickNote] = useState('')
  const [quickSavingId, setQuickSavingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const imagePreviews = useMemo(
    () => images.map((file, index) => ({ id: `${file.name}-${file.size}-${index}`, url: URL.createObjectURL(file) })),
    [images]
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      try {
        const response = await fetch('/api/auth/check', { cache: 'no-store', signal: controller.signal })
        if (cancelled) return

        if (!response.ok) {
          router.replace('/login')
          return
        }

        setLoading(false)
      } catch {
        if (!cancelled) router.replace('/login')
      } finally {
        clearTimeout(timeout)
      }
    }

    init()
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => registration.update().catch(() => {}))
          .catch(() => {})
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister())
        })
      }
    }
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (loading) return
    fetchMachines()
  }, [loading, view])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        preferencesKey,
        JSON.stringify({ view, search, searchPrice, sortMode, qualityFilter, listMode })
      )
    } catch {}
  }, [view, search, searchPrice, sortMode, qualityFilter, listMode])

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [imagePreviews])

  const hasAddDraft =
    showForm &&
    Boolean(
      name.trim() ||
        indexNumber.trim() ||
        purchasePrice.trim() ||
        grossPrice.trim() ||
        vatPrice.trim() ||
        description.trim() ||
        note.trim() ||
        images.length
    )

  useEffect(() => {
    if (!hasAddDraft) return

    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [hasAddDraft])

  async function fetchMachines() {
    setMachinesLoading(true)

    try {
      const status = view === 'active' ? 'available' : 'sold'
      const response = await fetch(`/api/machines?status=${encodeURIComponent(status)}`, { cache: 'no-store' })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        setErrorMessage('Nie udało się pobrać maszyn.')
        setMachines([])
        return
      }

      const data = await response.json()
      setErrorMessage('')
      setMachines(data.machines || [])
    } catch (error) {
      logError(error, 'fetchMachines')
      setErrorMessage('Nie udało się pobrać maszyn.')
      setMachines([])
    } finally {
      setMachinesLoading(false)
    }
  }

  function resetForm() {
    setName('')
    setIndexNumber('')
    setPurchasePrice('')
    setGrossPrice('')
    setVatPrice('')
    setDescription('')
    setNote('')
    setImages([])
  }

  async function addMachine() {
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Wpisz nazwę maszyny przed zapisem.' })
      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      setUploadStatus(images.length ? 'Przygotowanie zdjęć...' : '')
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('index_number', indexNumber.trim())
      formData.append('purchase_price', purchasePrice.trim())
      formData.append('gross_price', grossPrice.trim())
      formData.append('vat_price', vatPrice.trim())
      formData.append('description', description.trim())
      formData.append('note', note.trim())
      images.slice(0, 4).forEach((image, index) => {
        setUploadStatus(`Wysyłanie zdjęć ${index + 1}/${images.length}...`)
        formData.append(`image${index + 1}`, image)
      })

      const response = await fetch('/api/machines', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Create failed')
      resetForm()
      setShowForm(false)
      setToast({ type: 'success', message: 'Maszyna została dodana.' })
      await fetchMachines()
    } catch (error) {
      logError(error, 'home')
      setErrorMessage('Nie udało się zapisać maszyny lub zdjęć.')
      setToast({ type: 'error', message: 'Nie udało się zapisać maszyny lub zdjęć.' })
    } finally {
      setUploadStatus('')
      setSaving(false)
    }
  }

  async function handleImagesChange(event) {
    const files = Array.from(event.target.files || []).slice(0, 4)
    if (files.length === 0) {
      setImages([])
      return
    }

    try {
      setUploadStatus('Kompresowanie zdjęć...')
      const compressed = await compressImageFiles(files, (current, total) => {
        setUploadStatus(`Kompresowanie zdjęć ${current}/${total}...`)
      })
      setImages(compressed)
      const savedMb = files.reduce((sum, file) => sum + file.size, 0) - compressed.reduce((sum, file) => sum + file.size, 0)
      setUploadStatus(savedMb > 0 ? `Zdjęcia zmniejszone o ${(savedMb / 1024 / 1024).toFixed(1)} MB.` : 'Zdjęcia gotowe do wysłania.')
    } catch (error) {
      logError(error, 'compressAddImages')
      setToast({ type: 'error', message: 'Nie udało się przygotować zdjęć.' })
      setUploadStatus('')
      setImages([])
    }
  }

  async function moveToArchive(machine) {
    const response = await fetch(`/api/machines/${machine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sold', history_action: 'Archiwizacja', history_details: 'Maszyna przeniesiona do archiwum' }),
    })
    if (!response.ok) {
      setToast({ type: 'error', message: 'Nie udało się przenieść do archiwum.' })
      return
    }
    setToast({ type: 'success', message: 'Przeniesiono do archiwum.' })
    fetchMachines()
  }

  async function restoreMachine(machine) {
    const response = await fetch(`/api/machines/${machine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'available', history_action: 'Przywrócenie', history_details: 'Maszyna wróciła do magazynu' }),
    })
    if (!response.ok) {
      setToast({ type: 'error', message: 'Nie udało się przywrócić maszyny.' })
      return
    }
    setToast({ type: 'success', message: 'Maszyna wróciła do magazynu.' })
    fetchMachines()
  }

  async function deleteMachine(machine) {
    setDeleteTarget(machine)
    setDeleteConfirmName('')
  }

  function closeDeleteModal() {
    if (deleteSaving) return
    setDeleteTarget(null)
    setDeleteConfirmName('')
  }

  async function confirmDeleteMachine() {
    if (!deleteTarget) return
    const expectedName = deleteTarget.name || 'Bez nazwy'
    if (deleteConfirmName !== expectedName) {
      setToast({ type: 'error', message: 'Wpisana nazwa nie zgadza się z nazwą maszyny.' })
      return
    }

    setDeleteSaving(true)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/machines/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Delete failed')

      setToast({ type: 'success', message: 'Maszyna została usunięta.' })
      setDeleteTarget(null)
      setDeleteConfirmName('')
      fetchMachines()
    } catch (error) {
      logError(error, 'home')
      setErrorMessage('Nie udało się trwale usunąć maszyny.')
      setToast({ type: 'error', message: 'Nie udało się trwale usunąć maszyny.' })
    } finally {
      setDeleteSaving(false)
    }
  }

  function startQuickEdit(machine) {
    setQuickEditId(machine.id)
    setQuickName(String(machine.name || ''))
    setQuickIndexNumber(String(machine.index_number || ''))
    setQuickPurchasePrice(String(machine.purchase_price || ''))
    setQuickVatPrice(String(machine.vat_price || ''))
    setQuickGrossPrice(String(machine.gross_price || ''))
    setQuickNote(String(machine.note || ''))
  }

  async function saveQuickEdit(machine) {
    setQuickSavingId(machine.id)
    setErrorMessage('')

    try {
      const updates = {
        name: String(quickName || '').trim(),
        index_number: String(quickIndexNumber || '').trim(),
        purchase_price: String(quickPurchasePrice || '').trim(),
        vat_price: String(quickVatPrice || '').trim(),
        gross_price: String(quickGrossPrice || '').trim(),
        note: String(quickNote || '').trim(),
        history_action: 'Szybka edycja',
        history_details: quickEditHistoryDetails(machine, {
          name: String(quickName || '').trim(),
          index_number: String(quickIndexNumber || '').trim(),
          purchase_price: String(quickPurchasePrice || '').trim(),
          vat_price: String(quickVatPrice || '').trim(),
          gross_price: String(quickGrossPrice || '').trim(),
          note: String(quickNote || '').trim(),
        }),
      }
      const response = await fetch(`/api/machines/${machine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Quick edit failed')

      setQuickEditId(null)
      setToast({ type: 'success', message: 'Szybka edycja zapisana.' })
      await fetchMachines()
    } catch (error) {
      logError(error, 'home')
      setErrorMessage('Nie udało się zapisać szybkiej edycji.')
      setToast({ type: 'error', message: 'Nie udało się zapisać szybkiej edycji.' })
    } finally {
      setQuickSavingId(null)
    }
  }

  const filtered = useMemo(() => {
    const text = search.toLowerCase().trim()
    const price = searchPrice.toLowerCase().trim()

    const result = machines.filter((machine) => {
      const matchesText = !text || (machine.name || '').toLowerCase().includes(text) || (machine.index_number || '').toLowerCase().includes(text)
      const matchesPrice =
        !price ||
        String(machine.purchase_price || '').toLowerCase().includes(price) ||
        String(machine.vat_price || '').toLowerCase().includes(price) ||
        String(machine.gross_price || '').toLowerCase().includes(price)
      const matchesQuality =
        qualityFilter === 'all' ||
        (qualityFilter === 'no-image' && !machine.image1) ||
        (qualityFilter === 'no-price' && !machine.gross_price && !machine.vat_price && !machine.purchase_price) ||
        (qualityFilter === 'no-note' && !machine.note)

      return matchesText && matchesPrice && matchesQuality
    })

    return result.sort((a, b) => {
      if (sortMode === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'pl')
      if (sortMode === 'index') return String(a.index_number || '').localeCompare(String(b.index_number || ''), 'pl', { numeric: true })
      if (sortMode === 'gross-desc') return priceNumber(b.gross_price) - priceNumber(a.gross_price)
      if (sortMode === 'gross-asc') return priceNumber(a.gross_price) - priceNumber(b.gross_price)
      return Number(b.id || 0) - Number(a.id || 0)
    })
  }, [machines, search, searchPrice, qualityFilter, sortMode])

  function clearFilters() {
    setSearch('')
    setSearchPrice('')
    setQualityFilter('all')
    setSortMode('newest')
  }

  function tableSortLabel(mode) {
    if (sortMode === mode) return ' ↑'
    if (mode === 'gross-desc' && sortMode === 'gross-asc') return ' ↓'
    return ''
  }

  function toggleGrossSort() {
    setSortMode((current) => (current === 'gross-desc' ? 'gross-asc' : 'gross-desc'))
  }

  function openAddForm() {
    setView('active')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleAddForm() {
    if (showForm && hasAddDraft && !window.confirm('Masz niezapisane dane. Schować formularz bez zapisu?')) return
    setShowForm((current) => !current)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-white">
        <p className="text-lg font-semibold text-yellow-400">Ładowanie systemu...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] pb-20 text-zinc-100 sm:pb-0">
      {toast && (
        <div className={`fixed right-3 top-3 z-50 max-w-sm overflow-hidden rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-black/40 ${toast.type === 'error' ? 'border-red-500/30 bg-red-950 text-red-100' : 'border-yellow-500/30 bg-[#181818] text-yellow-100'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{toast.type === 'error' ? 'Błąd' : 'Gotowe'}</p>
          <p className="mt-0.5 font-bold">{toast.message}</p>
          <div className={`absolute inset-x-0 bottom-0 h-0.5 ${toast.type === 'error' ? 'bg-red-400' : 'bg-yellow-500'}`} />
        </div>
      )}
      <div className="mx-auto max-w-[1500px] px-3 pb-8 pt-3 sm:px-5 lg:px-6">
        <div className="mb-4 overflow-hidden rounded-2xl border border-yellow-500/35 bg-[#0b0b0b] shadow-2xl shadow-black/45 ring-1 ring-white/5">
          <img src="/banner.png" alt="Maszyny Gliznowo" loading="eager" className="h-auto max-h-56 min-h-28 w-full object-contain object-center brightness-110 contrast-110 saturate-110 sm:h-56 sm:max-h-none sm:object-cover lg:h-64" />
        </div>

        <section className="mb-4 rounded-2xl border border-yellow-500/15 bg-[#171717]/95 p-3 shadow-lg shadow-black/25 sm:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button onClick={() => setView('active')} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'active' ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-950/30' : 'bg-[#242424] text-zinc-100 shadow-sm shadow-black/20 hover:bg-[#2d2d2d] hover:shadow-md hover:shadow-black/25'}`}>MAGAZYN</button>
              <button onClick={() => setView('sold')} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'sold' ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-950/30' : 'bg-[#242424] text-zinc-100 shadow-sm shadow-black/20 hover:bg-[#2d2d2d] hover:shadow-md hover:shadow-black/25'}`}>ARCHIWUM</button>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              <input className={inputStyle} placeholder="Szukaj: nazwa lub indeks" value={search} onChange={(event) => setSearch(event.target.value)} />
              <input className={inputStyle} placeholder="Szukaj po cenie" value={searchPrice} onChange={(event) => setSearchPrice(event.target.value)} />
              <select className={selectStyle} value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                <option value="newest">Sortuj: najnowsze</option>
                <option value="name">Sortuj: nazwa</option>
                <option value="index">Sortuj: indeks</option>
                <option value="gross-desc">Cena malejąco</option>
                <option value="gross-asc">Cena rosnąco</option>
              </select>
              <select className={selectStyle} value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value)}>
                <option value="all">Filtr: wszystko</option>
                <option value="no-image">Bez zdjęcia</option>
                <option value="no-price">Bez cen</option>
                <option value="no-note">Bez notatki</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#202020] p-1">
                <button onClick={() => setListMode('cards')} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${listMode === 'cards' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:bg-[#2a2a2a] hover:text-white'}`}>Kafelki</button>
                <button onClick={() => setListMode('table')} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${listMode === 'table' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:bg-[#2a2a2a] hover:text-white'}`}>Tabela</button>
              </div>
              <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }} className="rounded-xl bg-red-600 shadow-sm shadow-red-950/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 hover:shadow-md hover:shadow-red-950/30">WYLOGUJ</button>
            </div>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 border-b border-yellow-500/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-normal text-white sm:text-[30px]">{view === 'active' ? 'Maszyny w magazynie' : 'Archiwum maszyn'}</h1>
            <p className="mt-2 inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[12px] font-semibold text-yellow-300">Ilość: {filtered.length}</p>
          </div>

          {view === 'active' && (
            <button onClick={toggleAddForm} className="hidden rounded-xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-4 py-2.5 text-sm font-bold text-black shadow-lg shadow-yellow-950/20 transition hover:bg-yellow-400 hover:shadow-md hover:shadow-yellow-950/30 sm:inline-flex">
              {showForm ? 'SCHOWAJ FORMULARZ' : '+ DODAJ MASZYN\u0118'}
            </button>
          )}
        </div>

        {errorMessage && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-sm font-semibold text-red-200">{errorMessage}</div>}

        {view === 'active' && showForm && (
          <section className="mb-5 overflow-hidden rounded-2xl border border-yellow-500/15 bg-[#181818] shadow-xl shadow-black/30">
            <div className="border-b border-yellow-500/10 px-4 py-3">
              <h2 className="text-lg font-bold text-yellow-400">{'Dodaj nową maszynę'}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-white/5 bg-[#202020] p-3">
                <p className="mb-3 text-xs font-bold uppercase text-zinc-500">Dane maszyny</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={inputStyle} placeholder="Nazwa" value={name} onChange={(event) => setName(event.target.value)} />
                  <input className={inputStyle} placeholder="Numer indeksu" value={indexNumber} onChange={(event) => setIndexNumber(event.target.value)} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#202020] p-3">
                <p className="mb-3 text-xs font-bold uppercase text-zinc-500">Ceny</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input className={inputStyle} placeholder="Cena zakupu" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} />
                  <input className={inputStyle} placeholder="VAT" value={vatPrice} onChange={(event) => setVatPrice(event.target.value)} />
                  <input className={inputStyle} placeholder="Cena" value={grossPrice} onChange={(event) => setGrossPrice(event.target.value)} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#202020] p-3">
                <p className="mb-3 text-xs font-bold uppercase text-zinc-500">{'Zdjęcia'}</p>
                <input type="file" multiple accept="image/*" className={inputStyle} onChange={handleImagesChange} />
                {images.length > 0 && <p className="mt-2 text-xs font-bold text-yellow-400">Wybrano: {images.length}/4</p>}
                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview.id} className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-[#181818]">
                        <img src={preview.url} alt={`Podgląd ${index + 1}`} className="h-20 w-full object-cover" />
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                {uploadStatus && <p className="mt-2 text-xs font-bold text-green-400">{uploadStatus}</p>}
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#202020] p-3">
                <p className="mb-3 text-xs font-bold uppercase text-zinc-500">Opis i notatka</p>
                <div className="grid grid-cols-1 gap-3">
                  <textarea className={`${inputStyle} h-24 resize-none`} placeholder="Opis" value={description} onChange={(event) => setDescription(event.target.value)} />
                  <textarea className={`${inputStyle} h-20 resize-none`} placeholder="Notatka" value={note} onChange={(event) => setNote(event.target.value)} />
                </div>
              </div>

              <button onClick={addMachine} disabled={saving} className="rounded-xl bg-green-600 shadow-sm shadow-green-950/30 p-3 text-sm font-bold text-white transition hover:bg-green-500 hover:shadow-md hover:shadow-green-950/30 disabled:cursor-not-allowed disabled:opacity-50 lg:col-span-2">
                {saving ? 'ZAPISYWANIE...' : 'ZAPISZ MASZYN\u0118'}
              </button>
            </div>
          </section>
        )}

        {machinesLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : listMode === 'table' ? (
          <div className="overflow-hidden rounded-2xl border border-yellow-500/15 bg-[#181818] shadow-xl shadow-black/25">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-yellow-500/15 bg-[#202020] text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-3"><button onClick={() => setSortMode('name')} className="text-left font-bold uppercase text-zinc-500 transition hover:text-yellow-400">Maszyna{tableSortLabel('name')}</button></th>
                    <th className="px-3 py-3"><button onClick={() => setSortMode('index')} className="text-left font-bold uppercase text-zinc-500 transition hover:text-yellow-400">Indeks{tableSortLabel('index')}</button></th>
                    <th className="px-3 py-3">Cena zakupu</th>
                    <th className="px-3 py-3">VAT</th>
                    <th className="px-3 py-3"><button onClick={toggleGrossSort} className="text-left font-bold uppercase text-zinc-500 transition hover:text-yellow-400">Cena{tableSortLabel('gross-desc')}</button></th>
                    <th className="px-3 py-3">Notatka</th>
                    <th className="px-3 py-3 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((machine) => {
                    const quickEditing = quickEditId === machine.id

                    return (
                    <tr key={machine.id} onClick={() => !quickEditing && router.push(`/machine/${machine.id}`)} className={`transition hover:bg-[#202020] ${quickEditing ? 'bg-[#202020]' : 'cursor-pointer'}`}>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[260px] items-center gap-3">
                          <div className="h-12 w-16 overflow-hidden rounded-xl bg-[#242424]">
                            {machine.image1 ? <img src={thumbnailUrl(machine.image1, 160, 120)} alt="" className="h-full w-full object-cover" /> : null}
                          </div>
                          {quickEditing ? (
                            <input className={`${inputStyle} min-w-[190px]`} value={quickName} onClick={(event) => event.stopPropagation()} onChange={(event) => setQuickName(event.target.value)} placeholder="Nazwa" />
                          ) : (
                            <span className="max-w-[260px] break-words font-bold text-white">{machine.name || 'Bez nazwy'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {quickEditing ? (
                          <input className={`${inputStyle} w-28`} value={quickIndexNumber} onClick={(event) => event.stopPropagation()} onChange={(event) => setQuickIndexNumber(event.target.value)} placeholder="Indeks" />
                        ) : (
                          <span className="rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-400">#{machine.index_number || 'brak'}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-semibold text-zinc-200">
                        {quickEditing ? <input className={`${inputStyle} w-28`} value={quickPurchasePrice} onClick={(event) => event.stopPropagation()} onChange={(event) => setQuickPurchasePrice(event.target.value)} placeholder="Cena zakupu" /> : formatPrice(machine.purchase_price)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-zinc-200">
                        {quickEditing ? <input className={`${inputStyle} w-28`} value={quickVatPrice} onClick={(event) => event.stopPropagation()} onChange={(event) => setQuickVatPrice(event.target.value)} placeholder="VAT" /> : formatPrice(machine.vat_price)}
                      </td>
                      <td className="px-3 py-3 font-bold text-yellow-400">
                        {quickEditing ? <input className={`${inputStyle} w-28`} value={quickGrossPrice} onClick={(event) => event.stopPropagation()} onChange={(event) => setQuickGrossPrice(event.target.value)} placeholder="Cena" /> : formatPrice(machine.gross_price)}
                      </td>
                      <td className="max-w-[280px] px-3 py-3 text-zinc-300">
                        {quickEditing ? (
                          <textarea className={`${inputStyle} h-20 min-w-[260px] resize-none`} value={quickNote} onClick={(event) => event.stopPropagation()} onChange={(event) => setQuickNote(event.target.value)} placeholder="Notatka" />
                        ) : (
                          <span className="line-clamp-2">{machine.note || 'Brak notatki'}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                        {quickEditing ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => saveQuickEdit(machine)} disabled={quickSavingId === machine.id} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-green-950/30 transition hover:bg-green-500 disabled:opacity-50">ZAPISZ</button>
                            <button onClick={() => setQuickEditId(null)} className="rounded-xl border border-white/10 bg-[#242424] px-3 py-2 text-xs font-bold text-white shadow-sm shadow-black/20 transition hover:bg-[#303030]">ANULUJ</button>
                          </div>
                        ) : view === 'active' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startQuickEdit(machine)} className="rounded-xl border border-white/10 bg-[#242424] px-3 py-2 text-xs font-bold text-white shadow-sm shadow-black/20 transition hover:bg-[#303030]">EDYTUJ</button>
                            <button onClick={() => moveToArchive(machine)} className="rounded-xl bg-yellow-500 px-3 py-2 text-xs font-bold text-black shadow-sm shadow-yellow-950/30 transition hover:bg-yellow-400">ARCHIWIZUJ</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startQuickEdit(machine)} className="rounded-xl border border-white/10 bg-[#242424] px-3 py-2 text-xs font-bold text-white shadow-sm shadow-black/20 transition hover:bg-[#303030]">EDYTUJ</button>
                            <button onClick={() => restoreMachine(machine)} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-green-950/30 transition hover:bg-green-500">PRZYWRÓĆ</button>
                            <button onClick={() => deleteMachine(machine)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-red-950/30 transition hover:bg-red-500">USUŃ</button>
                          </div>
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((machine) => {
            const quickEditing = quickEditId === machine.id

            return (
              <article key={machine.id} onClick={() => !quickEditing && router.push(`/machine/${machine.id}`)} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-yellow-500/15 bg-[#171717] shadow-md shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/45 hover:bg-[#1d1d1d]">
                <div className="relative h-[112px] bg-[#242424]">
                  {machine.image1 ? <img src={thumbnailUrl(machine.image1)} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" alt={machine.name || 'Maszyna'} /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">Brak zdjęcia</div>}
                  <div className="absolute left-2 top-2 rounded-full border border-yellow-500/35 bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-yellow-300 backdrop-blur">#{machine.index_number || 'brak'}</div>
                  {(!machine.image1 || !machine.gross_price || !machine.note) && (
                    <div className="absolute right-2 top-2 rounded-full border border-red-500/30 bg-red-950/80 px-2 py-1 text-[10px] font-bold uppercase text-red-200 backdrop-blur">Braki</div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-2.5">
                  <h2 className="mb-2 min-h-8 break-words text-[13px] font-semibold leading-snug text-white">{machine.name || 'Bez nazwy'}</h2>
                  <div className="mb-3 rounded-xl border border-white/5 bg-[#202020] p-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="rounded-xl bg-[#181818] p-2"><p className="text-[10px] font-semibold uppercase text-zinc-500">Cena zakupu</p><p className="break-words text-[12px] font-semibold text-zinc-100">{formatPrice(machine.purchase_price)}</p></div>
                      <div className="rounded-xl bg-[#181818] p-2"><p className="text-[10px] font-semibold uppercase text-zinc-500">VAT</p><p className="break-words text-[12px] font-semibold text-zinc-100">{formatPrice(machine.vat_price)}</p></div>
                      <div className="rounded-xl bg-yellow-500 p-2 text-black shadow-inner shadow-yellow-700/20"><p className="text-[10px] font-bold uppercase text-black/60">Cena</p><p className="break-words text-[12px] font-bold">{formatPrice(machine.gross_price)}</p></div>
                    </div>
                  </div>

                  {quickEditing ? (
                    <div className="mb-3 space-y-2" onClick={(event) => event.stopPropagation()}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input className={inputStyle} placeholder="Cena zakupu" value={quickPurchasePrice} onChange={(event) => setQuickPurchasePrice(event.target.value)} />
                        <input className={inputStyle} placeholder="VAT" value={quickVatPrice} onChange={(event) => setQuickVatPrice(event.target.value)} />
                        <input className={inputStyle} placeholder="Cena" value={quickGrossPrice} onChange={(event) => setQuickGrossPrice(event.target.value)} />
                      </div>
                      <textarea className={`${inputStyle} h-20 resize-none`} placeholder="Notatka" value={quickNote} onChange={(event) => setQuickNote(event.target.value)} />
                    </div>
                  ) : (
                    <p className="mb-3 line-clamp-2 min-h-9 break-words rounded-xl border border-white/5 bg-[#202020] px-3 py-2 text-[12px] leading-5 text-zinc-300">{machine.note || 'Brak notatki'}</p>
                  )}

                  {quickEditing ? (
                    <div className="mt-auto grid grid-cols-2 gap-2" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => saveQuickEdit(machine)} disabled={quickSavingId === machine.id} className="rounded-xl bg-green-600 shadow-sm shadow-green-950/30 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-500 hover:shadow-md hover:shadow-green-950/30 disabled:opacity-50">ZAPISZ</button>
                      <button onClick={() => setQuickEditId(null)} className="rounded-xl border border-white/10 bg-[#242424] shadow-sm shadow-black/20 px-3 py-2 text-xs font-bold text-white transition hover:bg-[#303030] hover:shadow-md hover:shadow-black/25">ANULUJ</button>
                    </div>
                  ) : view === 'active' ? (
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button onClick={(event) => { event.stopPropagation(); startQuickEdit(machine) }} className="rounded-xl border border-white/10 bg-[#242424] shadow-sm shadow-black/20 px-3 py-2 text-xs font-bold text-white transition hover:bg-[#303030] hover:shadow-md hover:shadow-black/25">SZYBKA EDYCJA</button>
                      <button onClick={(event) => { event.stopPropagation(); moveToArchive(machine) }} className="rounded-xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-3 py-2 text-xs font-bold text-black transition hover:bg-yellow-400 hover:shadow-md hover:shadow-yellow-950/30">ARCHIWIZUJ</button>
                    </div>
                  ) : (
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button onClick={(event) => { event.stopPropagation(); restoreMachine(machine) }} className="rounded-xl bg-green-600 shadow-sm shadow-green-950/30 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-500 hover:shadow-md hover:shadow-green-950/30">PRZYWRÓĆ</button>
                      <button onClick={(event) => { event.stopPropagation(); deleteMachine(machine) }} className="rounded-xl bg-red-600 shadow-sm shadow-red-950/30 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 hover:shadow-md hover:shadow-red-950/30">USUŃ</button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        )}

        {!machinesLoading && filtered.length === 0 && (
          <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-[#181818] p-8 text-center shadow-xl shadow-black/25">
            <p className="text-xl font-bold text-white">{'Brak maszyn dla obecnych filtrów'}</p>
            <p className="mt-2 text-sm text-zinc-400">{'Zmień wyszukiwanie albo wyczyść filtry, żeby zobaczyć więcej pozycji.'}</p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button onClick={clearFilters} className="rounded-xl border border-white/10 bg-[#242424] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-black/20 transition hover:bg-[#303030]">{'WYCZYŚĆ FILTRY'}</button>
              {view === 'active' && (
                <button onClick={openAddForm} className="rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-bold text-black shadow-sm shadow-yellow-950/30 transition hover:bg-yellow-400">{'DODAJ MASZYNĘ'}</button>
              )}
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={closeDeleteModal}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-red-500/30 bg-[#181818] shadow-2xl shadow-black/50" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-red-500/20 p-4">
              <p className="text-[12px] font-bold uppercase text-red-300">Trwałe usuwanie</p>
              <h2 className="mt-1 break-words text-xl font-semibold text-white">{deleteTarget.name || 'Bez nazwy'}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Ta operacja usunie maszynę z bazy i spróbuje usunąć jej zdjęcia z serwera. Żeby potwierdzić, wpisz dokładną nazwę maszyny.</p>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-xl border border-white/5 bg-[#202020] p-3">
                <p className="text-[11px] font-bold uppercase text-zinc-500">Wpisz nazwę</p>
                <p className="mt-1 break-words text-sm font-semibold text-zinc-200">{deleteTarget.name || 'Bez nazwy'}</p>
              </div>
              <input className={inputStyle} value={deleteConfirmName} onChange={(event) => setDeleteConfirmName(event.target.value)} placeholder="Dokładna nazwa maszyny" autoFocus />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={confirmDeleteMachine} disabled={deleteSaving || deleteConfirmName !== (deleteTarget.name || 'Bez nazwy')} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                  {deleteSaving ? 'USUWANIE...' : 'USUŃ NA STAŁE'}
                </button>
                <button onClick={closeDeleteModal} disabled={deleteSaving} className="rounded-xl border border-white/10 bg-[#242424] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50">
                  ANULUJ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-yellow-500/20 bg-[#181818]/95 p-2 shadow-2xl shadow-black backdrop-blur sm:hidden">
        <button onClick={() => setView('active')} className={`rounded-2xl px-2 py-2 text-xs font-bold ${view === 'active' ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-950/30' : 'bg-[#242424] text-white'}`}>Magazyn</button>
        <button onClick={openAddForm} className="rounded-2xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-2 py-2 text-xs font-bold text-black">Dodaj</button>
        <button onClick={() => setView('sold')} className={`rounded-2xl px-2 py-2 text-xs font-bold ${view === 'sold' ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-950/30' : 'bg-[#242424] text-white'}`}>Archiwum</button>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="rounded-2xl bg-[#242424] shadow-sm shadow-black/20 px-2 py-2 text-xs font-bold text-white">Szukaj</button>
      </nav>

    </main>
  )
}



