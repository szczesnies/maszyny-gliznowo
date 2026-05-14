'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle =
  'w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-[14px] font-medium text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-yellow-500/60 focus:bg-[#222] focus:ring-2 focus:ring-yellow-500/10'

function formatPrice(value) {
  if (!value) return '-'
  return `${value} zł`
}

function thumbnailUrl(url, width = 260, height = 160) {
  if (!url || !url.includes('/storage/v1/object/public/')) return url
  return url
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    .concat(url.includes('?') ? '&' : '?', `width=${width}&height=${height}&resize=cover&quality=70`)
}

function historyKey(machineId) {
  return `machine-history-${machineId}`
}

function readLocalHistory(machineId) {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(historyKey(machineId)) || '[]')
  } catch {
    return []
  }
}

function writeLocalHistory(machineId, entry) {
  if (typeof window === 'undefined') return
  const history = readLocalHistory(machineId)
  window.localStorage.setItem(historyKey(machineId), JSON.stringify([entry, ...history].slice(0, 50)))
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function changeSentence(label, before, after) {
  const oldValue = before || '-'
  const newValue = after || '-'
  return `${label} zmieniono z ${oldValue} na ${newValue}.`
}

export default function MachinePage({ params }) {
  const router = useRouter()
  const [machine, setMachine] = useState(null)
  const [history, setHistory] = useState([])
  const [mainImage, setMainImage] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIndexNumber, setEditIndexNumber] = useState('')
  const [editPurchasePrice, setEditPurchasePrice] = useState('')
  const [editGrossPrice, setEditGrossPrice] = useState('')
  const [editVatPrice, setEditVatPrice] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editImages, setEditImages] = useState([])
  const [editImageSlots, setEditImageSlots] = useState([null, null, null, null])
  const [deleteImageSlots, setDeleteImageSlots] = useState([false, false, false, false])
  const [uploadStatus, setUploadStatus] = useState('')
  const [toast, setToast] = useState(null)

  const editImagePreviews = useMemo(
    () => editImages.map((file, index) => ({ id: `${file.name}-${file.size}-${index}`, url: URL.createObjectURL(file) })),
    [editImages]
  )

  const editSlotPreviews = useMemo(
    () => editImageSlots.map((file, index) => (file ? { id: `${file.name}-${file.size}-${index}`, url: URL.createObjectURL(file) } : null)),
    [editImageSlots]
  )

  const fetchHistory = useCallback(async function fetchHistory(machineId) {
    const localHistory = readLocalHistory(machineId)

    try {
      const response = await fetch(`/api/machines/${machineId}/history`)
      if (!response.ok) throw new Error('History failed')
      const data = await response.json()
      setHistory(data.history?.length ? data.history : localHistory)
    } catch {
      setHistory(localHistory)
    }
  }, [])

  const fetchMachine = useCallback(async function fetchMachine() {
    const { id } = await params
    const response = await fetch(`/api/machines/${id}`)

    if (response.status === 401) {
      router.push('/login')
      return
    }

    if (!response.ok) {
      setErrorMessage('Nie udało się pobrać maszyny.')
      setLoading(false)
      return
    }

    const { machine: data } = await response.json()
    setMachine(data)
    setEditName(data.name || '')
    setEditIndexNumber(data.index_number || '')
    setEditPurchasePrice(data.purchase_price || '')
    setEditGrossPrice(data.gross_price || '')
    setEditVatPrice(data.vat_price || '')
    setEditDescription(data.description || '')
    setEditNote(data.note || '')
    setEditImageSlots([null, null, null, null])
    setDeleteImageSlots([false, false, false, false])
    setMainImage(data.image1 || data.image2 || data.image3 || data.image4 || '')
    setErrorMessage('')
    setLoading(false)
    fetchHistory(data.id)
  }, [fetchHistory, params, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMachine()
  }, [fetchMachine])

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timeout)
  }, [toast])

  const images = useMemo(() => {
    if (!machine) return []
    return [machine.image1, machine.image2, machine.image3, machine.image4].filter(Boolean)
  }, [machine])

  const hasEditChanges =
    editMode &&
    machine &&
    (String(machine.name || '') !== String(editName || '') ||
      String(machine.index_number || '') !== String(editIndexNumber || '') ||
      String(machine.purchase_price || '') !== String(editPurchasePrice || '') ||
      String(machine.gross_price || '') !== String(editGrossPrice || '') ||
      String(machine.vat_price || '') !== String(editVatPrice || '') ||
      String(machine.description || '') !== String(editDescription || '') ||
      String(machine.note || '') !== String(editNote || '') ||
      editImages.length > 0 ||
      editImageSlots.some(Boolean) ||
      deleteImageSlots.some(Boolean))

  useEffect(() => {
    return () => {
      editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [editImagePreviews])

  useEffect(() => {
    return () => {
      editSlotPreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview.url)
      })
    }
  }, [editSlotPreviews])

  useEffect(() => {
    if (!hasEditChanges) return

    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [hasEditChanges])

  function openLightbox(image = mainImage) {
    const index = images.indexOf(image)
    setLightboxIndex(index >= 0 ? index : 0)
    setShowLightbox(true)
  }

  function previousImage() {
    setLightboxIndex((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  function nextImage() {
    setLightboxIndex((current) => (current === images.length - 1 ? 0 : current + 1))
  }

  function canDiscardEdit() {
    return !hasEditChanges || window.confirm('Masz niezapisane zmiany. Opuścić bez zapisu?')
  }

  function goBack() {
    if (!canDiscardEdit()) return
    router.push('/')
  }

  function toggleEditMode() {
    if (editMode && !canDiscardEdit()) return
    if (editMode) {
      setEditImageSlots([null, null, null, null])
      setDeleteImageSlots([false, false, false, false])
    }
    setEditMode((current) => !current)
  }

  async function restoreFromArchive() {
    if (!machine || machine.status !== 'sold') return
    setSaving(true)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/machines/${machine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available', history_action: 'Przywrócenie', history_details: 'Maszyna wróciła do magazynu ze strony szczegółów' }),
      })
      if (!response.ok) throw new Error('Restore failed')

      setToast({ type: 'success', message: 'Maszyna wróciła do magazynu.' })
      await fetchMachine()
    } catch (error) {
      console.error(error)
      setErrorMessage('Nie udało się przywrócić maszyny z archiwum.')
      setToast({ type: 'error', message: 'Nie udało się przywrócić maszyny.' })
    } finally {
      setSaving(false)
    }
  }

  async function moveToArchive() {
    if (!machine || machine.status === 'sold') return
    setSaving(true)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/machines/${machine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold', history_action: 'Archiwizacja', history_details: 'Maszyna przeniesiona do archiwum ze strony szczegółów' }),
      })
      if (!response.ok) throw new Error('Archive failed')

      setToast({ type: 'success', message: 'Maszyna została przeniesiona do archiwum.' })
      await fetchMachine()
    } catch (error) {
      console.error(error)
      setErrorMessage('Nie udało się przenieść maszyny do archiwum.')
      setToast({ type: 'error', message: 'Nie udało się przenieść maszyny do archiwum.' })
    } finally {
      setSaving(false)
    }
  }

  function setSlotImage(index, file) {
    setEditImageSlots((current) => {
      const next = [...current]
      next[index] = file || null
      return next
    })
    if (file) {
      setDeleteImageSlots((current) => {
        const next = [...current]
        next[index] = false
        return next
      })
    }
  }

  function markImageForDelete(index) {
    setEditImageSlots((current) => {
      const next = [...current]
      next[index] = null
      return next
    })
    setDeleteImageSlots((current) => {
      const next = [...current]
      next[index] = true
      return next
    })
  }

  function cancelImageDelete(index) {
    setDeleteImageSlots((current) => {
      const next = [...current]
      next[index] = false
      return next
    })
  }

  function changedFields(updateData) {
    if (!machine) return []

    return [
      ['Nazwa', machine.name, updateData.name],
      ['Indeks', machine.index_number, updateData.index_number],
      ['Cena kupna', machine.purchase_price, updateData.purchase_price],
      ['Cena netto', machine.vat_price, updateData.vat_price],
      ['Cena brutto', machine.gross_price, updateData.gross_price],
      ['Opis', machine.description, updateData.description],
      ['Notatka', machine.note, updateData.note],
    ]
      .filter(([, before, after]) => String(before || '') !== String(after || ''))
      .map(([label, before, after]) => changeSentence(label, before, after))
  }

  async function saveChanges() {
    if (!machine) return
    setSaving(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      const updateData = {
        name: String(editName || '').trim(),
        index_number: String(editIndexNumber || '').trim(),
        purchase_price: String(editPurchasePrice || '').trim(),
        gross_price: String(editGrossPrice || '').trim(),
        vat_price: String(editVatPrice || '').trim(),
        description: String(editDescription || '').trim(),
        note: String(editNote || '').trim(),
      }
      const changes = changedFields(updateData)

      Object.entries(updateData).forEach(([key, value]) => formData.append(key, value))

      const selectedSlots = editImageSlots
        .map((file, index) => ({ file, index }))
        .filter((slot) => slot.file)

      const deletedSlots = deleteImageSlots
        .map((marked, index) => ({ marked, index }))
        .filter((slot) => slot.marked)

      deletedSlots.forEach(({ index }) => {
        formData.append(`delete_image${index + 1}`, 'true')
        changes.push(`Zdjęcie ${index + 1}: usunięto`)
      })

      selectedSlots.forEach(({ file, index }, uploadIndex) => {
        setUploadStatus(`Podmiana zdjęcia ${index + 1} (${uploadIndex + 1}/${selectedSlots.length})...`)
        formData.append(`image${index + 1}`, file)
        changes.push(`Zdjęcie ${index + 1}: podmieniono`)
      })

      formData.append('history_action', 'Edycja maszyny')
      formData.append('history_details', changes.length > 0 ? changes.join('\n') : 'Zapisano zmiany.')

      const response = await fetch(`/api/machines/${machine.id}`, { method: 'PATCH', body: formData })
      if (!response.ok) throw new Error('Save failed')

      setEditImages([])
      setEditImageSlots([null, null, null, null])
      setDeleteImageSlots([false, false, false, false])
      setEditMode(false)
      setToast({ type: 'success', message: 'Zmiany zostały zapisane.' })
      await fetchMachine()
    } catch (error) {
      console.error(error)
      setErrorMessage('Nie udało się zapisać zmian lub zdjęć.')
      setToast({ type: 'error', message: 'Nie udało się zapisać zmian lub zdjęć.' })
    } finally {
      setUploadStatus('')
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-white"><p className="text-lg font-semibold text-yellow-400">Ładowanie maszyny...</p></main>
  }

  if (!machine) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-5 text-white">
        <div className="rounded-2xl border border-yellow-500/20 bg-[#181818] p-6 text-center">
          <p className="mb-4 text-lg font-bold">Nie znaleziono maszyny.</p>
          <button onClick={() => router.push('/')} className="rounded-2xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-4 py-2 text-sm font-bold text-black">WRÓĆ</button>
        </div>
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
        <img src="/banner.png" alt="Maszyny Gliznowo" loading="eager" className="mb-4 h-40 w-full rounded-2xl border border-yellow-500/15 object-cover object-center shadow-xl shadow-black/35 sm:h-48 lg:h-56" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-yellow-500/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={goBack} className="rounded-xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-400 hover:shadow-md hover:shadow-yellow-950/30">WRÓĆ</button>
            <button onClick={toggleEditMode} className="rounded-xl border border-yellow-500/25 bg-[#181818] px-4 py-2.5 text-sm font-bold text-white transition hover:border-yellow-500/60 hover:bg-[#222]">{editMode ? 'ANULUJ' : 'EDYTUJ'}</button>
          </div>
          <div className="hidden rounded-2xl border border-yellow-500/15 bg-[#181818] px-3 py-2 text-xs font-bold text-zinc-400 sm:block">
            {machine.status === 'sold' ? 'ARCHIWUM' : 'MAGAZYN'} / {images.length} zdjęć / ID {machine.id}
          </div>
        </div>

        {errorMessage && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-sm font-semibold text-red-200">{errorMessage}</div>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-2xl border border-yellow-500/15 bg-[#171717] p-3 shadow-lg shadow-black/25 sm:p-4">
            <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#242424] shadow-lg shadow-black/30">
              {mainImage ? (
                <img src={mainImage} alt={machine.name || 'Maszyna'} onClick={() => openLightbox(mainImage)} className="h-[300px] w-full cursor-pointer object-cover transition duration-300 hover:scale-[1.01] hover:opacity-95 sm:h-[440px] lg:h-[520px]" />
              ) : (
                <div className="flex h-[300px] w-full items-center justify-center text-zinc-500 sm:h-[440px] lg:h-[520px]">Brak zdjęcia</div>
              )}
              <div className="absolute left-3 top-3 rounded-full border border-yellow-500/30 bg-black/75 px-3 py-1 text-xs font-bold text-yellow-400 backdrop-blur">
                {images.length > 0 ? `${Math.max(images.indexOf(mainImage), 0) + 1} / ${images.length}` : '0 / 4'}
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button key={image} onClick={() => setMainImage(image)} className={`overflow-hidden rounded-xl border-2 transition ${mainImage === image ? 'border-yellow-500' : 'border-transparent hover:border-yellow-500/40'}`} aria-label={`Zdjęcie ${index + 1}`}>
                    <img src={thumbnailUrl(image)} alt="" loading="lazy" decoding="async" className="h-20 w-full object-cover sm:h-24" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-yellow-500/15 bg-[#171717] shadow-lg shadow-black/25">
            {editMode ? (
              <div className="p-4">
                <h1 className="mb-4 text-2xl font-bold text-yellow-400">Edycja maszyny</h1>
                <div className="space-y-3">
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} className={inputStyle} placeholder="Nazwa" />
                  <input value={editIndexNumber} onChange={(event) => setEditIndexNumber(event.target.value)} className={inputStyle} placeholder="Numer indeksu" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input value={editPurchasePrice} onChange={(event) => setEditPurchasePrice(event.target.value)} className={inputStyle} placeholder="Cena kupna" />
                    <input value={editVatPrice} onChange={(event) => setEditVatPrice(event.target.value)} className={inputStyle} placeholder="Cena netto" />
                    <input value={editGrossPrice} onChange={(event) => setEditGrossPrice(event.target.value)} className={inputStyle} placeholder="Cena brutto" />
                  </div>
                  <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className={`${inputStyle} h-28 resize-none`} placeholder="Opis" />
                  <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} className={`${inputStyle} h-20 resize-none`} placeholder="Notatka" />
                  <div className="rounded-2xl border border-yellow-500/20 bg-[#242424] p-3">
                    <p className="mb-1 text-sm font-bold text-yellow-400">Podmień konkretne zdjęcie</p>
                    <p className="mb-3 text-xs text-zinc-400">Wybierz plik tylko przy tym numerze zdjęcia, które chcesz zastąpić.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[machine.image1, machine.image2, machine.image3, machine.image4].map((image, index) => {
                        const preview = editSlotPreviews[index]
                        const markedForDelete = deleteImageSlots[index]
                        const visibleImage = markedForDelete ? '' : preview?.url || image

                        return (
                          <div key={index} className={`rounded-2xl border p-2 ${markedForDelete ? 'border-red-500/30 bg-red-950/20' : 'border-white/5 bg-[#181818]'}`}>
                            <div className="relative mb-2 h-28 overflow-hidden rounded-xl bg-[#242424]">
                              {visibleImage ? (
                                <img src={visibleImage} alt={`Zdjęcie ${index + 1}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs font-bold text-zinc-500">{markedForDelete ? 'Do usunięcia' : 'Brak zdjęcia'}</div>
                              )}
                              <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-xs font-bold text-yellow-400">{index + 1}</span>
                              {preview && <span className="absolute bottom-2 left-2 rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold text-white">Nowe</span>}
                              {markedForDelete && <span className="absolute bottom-2 left-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white">Usuwasz</span>}
                            </div>
                            <input type="file" accept="image/*" disabled={markedForDelete} onChange={(event) => setSlotImage(index, event.target.files?.[0])} className={inputStyle} />
                            {markedForDelete ? (
                              <button type="button" onClick={() => cancelImageDelete(index)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#242424] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#303030]">
                                COFNIJ USUNIĘCIE
                              </button>
                            ) : preview ? (
                              <button type="button" onClick={() => setSlotImage(index, null)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#242424] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#303030]">
                                ANULUJ PODMIANĘ
                              </button>
                            ) : image ? (
                              <button type="button" onClick={() => markImageForDelete(index)} className="mt-2 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500">
                                USUŃ ZDJĘCIE
                              </button>
                            ) : (
                              <p className="mt-2 rounded-xl border border-white/5 bg-[#202020] px-3 py-2 text-center text-xs font-bold text-zinc-500">Pusty slot</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {uploadStatus && <p className="mt-2 text-xs font-bold text-green-400">{uploadStatus}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={saveChanges} disabled={saving} className="rounded-2xl bg-green-600 shadow-sm shadow-green-950/30 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-500 hover:shadow-md hover:shadow-green-950/30 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'ZAPISYWANIE...' : 'ZAPISZ ZMIANY'}</button>
                    <button onClick={toggleEditMode} disabled={saving} className="rounded-2xl border border-white/10 bg-[#242424] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-black/20 transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50">ANULUJ</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-yellow-500/10 p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <p className="inline-flex rounded-full border border-yellow-500/30 bg-black/40 px-3 py-1 text-sm font-bold text-yellow-400">#{machine.index_number || 'brak indeksu'}</p>
                    {machine.status === 'sold' ? (
                      <button
                        type="button"
                        onClick={restoreFromArchive}
                        disabled={saving}
                        title="Przywróć do magazynu"
                        className="group inline-flex min-w-24 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 text-sm font-bold text-red-200 transition hover:border-green-500/40 hover:bg-green-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="group-hover:hidden">{saving ? 'Przywracanie...' : 'Archiwum'}</span>
                        <span className="hidden group-hover:inline">{saving ? 'Przywracanie...' : 'Przywróć'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={moveToArchive}
                        disabled={saving}
                        title="Przenieś do archiwum"
                        className="group inline-flex min-w-28 rounded-full border border-green-500/30 bg-green-950/30 px-3 py-1 text-sm font-bold text-green-300 transition hover:border-red-500/40 hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="group-hover:hidden">{saving ? 'Archiwizacja...' : 'W magazynie'}</span>
                        <span className="hidden group-hover:inline">{saving ? 'Archiwizacja...' : 'Archiwizuj'}</span>
                      </button>
                    )}
                  </div>
                  <h1 className="break-words text-[26px] font-semibold leading-tight tracking-normal text-white sm:text-[32px]">{machine.name || 'Bez nazwy'}</h1>
                </div>

                <div className="space-y-3 p-4">
                  <div className="rounded-2xl border border-yellow-500/15 bg-[#202020] p-3.5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase text-zinc-500">Panel maszyny</p>
                      <button onClick={toggleEditMode} className="rounded-xl bg-yellow-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-yellow-400">EDYTUJ DANE</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#181818] p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">Status</p>
                        {machine.status === 'sold' ? (
                          <button
                            type="button"
                            onClick={restoreFromArchive}
                            disabled={saving}
                            title="Przywróć do magazynu"
                            className="group mx-auto mt-1 rounded-lg px-2 py-1 text-xs font-bold text-red-200 transition hover:bg-green-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="group-hover:hidden">{saving ? 'Przywracanie...' : 'Archiwum'}</span>
                            <span className="hidden group-hover:inline">{saving ? 'Przywracanie...' : 'Przywróć'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={moveToArchive}
                            disabled={saving}
                            title="Przenieś do archiwum"
                            className="group mx-auto mt-1 rounded-lg px-2 py-1 text-xs font-bold text-green-300 transition hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="group-hover:hidden">{saving ? 'Archiwizacja...' : 'Magazyn'}</span>
                            <span className="hidden group-hover:inline">{saving ? 'Archiwizacja...' : 'Archiwizuj'}</span>
                          </button>
                        )}
                      </div>
                      <div className="rounded-xl bg-[#181818] p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">Zdjęcia</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-100">{images.length}/4</p>
                      </div>
                      <div className="rounded-xl bg-[#181818] p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">Historia</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-100">{history.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-[#202020] p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Cena kupna</p><p className="break-words text-[17px] font-semibold text-white">{formatPrice(machine.purchase_price)}</p></div>
                    <div className="rounded-2xl border border-white/5 bg-[#202020] p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Cena netto</p><p className="break-words text-[17px] font-semibold text-white">{formatPrice(machine.vat_price)}</p></div>
                    <div className="rounded-2xl bg-yellow-500 p-3 text-black shadow-inner shadow-yellow-700/20"><p className="text-[11px] font-bold uppercase text-black/60">Cena brutto</p><p className="break-words text-[19px] font-bold">{formatPrice(machine.gross_price)}</p></div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-[#202020] p-4"><h2 className="mb-2 text-[15px] font-semibold text-yellow-400">Opis</h2><p className="whitespace-pre-line break-words text-[14px] leading-6 text-zinc-200">{machine.description || 'Brak opisu'}</p></div>
                  <div className="rounded-2xl border border-white/5 bg-[#202020] p-4"><h2 className="mb-2 text-[15px] font-semibold text-yellow-400">Notatka</h2><p className="whitespace-pre-line break-words text-[14px] leading-6 text-zinc-200">{machine.note || 'Brak notatki'}</p></div>
                  <div className="rounded-2xl border border-white/5 bg-[#202020] p-4">
                    <button
                      onClick={() => setShowHistory((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="text-base font-bold text-yellow-400">Historia zmian</span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full border border-yellow-500/20 bg-[#181818] px-2.5 py-1 text-xs font-bold text-zinc-400">
                          {history.length}
                        </span>
                        <span className="text-sm font-bold text-zinc-400">{showHistory ? 'Zwi\u0144' : 'Poka\u017c'}</span>
                      </span>
                    </button>

                    {showHistory && (history.length > 0 ? (
                      <div className="mt-3 max-h-72 space-y-0 overflow-y-auto pr-1">
                        {history.map((entry) => (
                        <div key={entry.id || `${entry.created_at}-${entry.action}`} className="relative border-l border-yellow-500/20 pb-3 pl-4 last:pb-0">
                          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-[0_0_0_3px_#242424]" />

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-yellow-400">
                              {entry.action || 'Zmiana'}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-500">{formatDate(entry.created_at)}</span>
                          </div>

                          {entry.details && (
                            <p className="mt-1 whitespace-pre-line break-words text-xs leading-5 text-zinc-300">
                              {entry.details}
                            </p>
                          )}
                        </div>
                      ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-yellow-500/10 bg-[#181818] p-3 text-sm text-zinc-400">
                        Brak zapisanej historii dla tej maszyny.
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {showLightbox && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4" onClick={() => setShowLightbox(false)}>
          <img src={images[lightboxIndex]} alt="" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button onClick={(event) => { event.stopPropagation(); previousImage() }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-2xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-4 py-3 text-2xl font-bold text-black sm:left-5" aria-label="Poprzednie zdjęcie">‹</button>
              <button onClick={(event) => { event.stopPropagation(); nextImage() }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-4 py-3 text-2xl font-bold text-black sm:right-5" aria-label="Następne zdjęcie">›</button>
            </>
          )}
          <div className="absolute bottom-5 rounded-2xl border border-yellow-500/30 bg-[#181818] px-4 py-2 text-sm font-bold text-yellow-400">{lightboxIndex + 1} / {images.length}</div>
          <button onClick={(event) => { event.stopPropagation(); setShowLightbox(false) }} className="absolute right-3 top-3 rounded-2xl bg-yellow-500 shadow-sm shadow-yellow-950/30 px-4 py-2 text-lg font-bold text-black sm:right-5 sm:top-5" aria-label="Zamknij">X</button>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-yellow-500/20 bg-[#181818]/95 p-2 shadow-2xl shadow-black backdrop-blur sm:hidden">
        <button onClick={goBack} className="rounded-2xl bg-yellow-500 px-2 py-2 text-xs font-bold text-black shadow-sm shadow-yellow-950/30">Wróć</button>
        <button onClick={toggleEditMode} className={`rounded-2xl px-2 py-2 text-xs font-bold ${editMode ? 'bg-red-600 text-white' : 'bg-[#242424] text-white'}`}>{editMode ? 'Anuluj' : 'Edytuj'}</button>
      </nav>
    </main>
  )
}


