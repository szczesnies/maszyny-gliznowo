'use client'

import Button from './Button'
import ImageFallback from './ImageFallback'
import { formatPrice } from '../lib/machineUtils'

export default function MachineCard({ machine, view, quickEditing, quickValues, onQuickChange, onOpen, onQuickEdit, onSaveQuickEdit, onArchive, onRestore, onDelete, saving }) {
  return (
    <article onClick={() => !quickEditing && onOpen(machine)} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-yellow-500/15 bg-[#171717] shadow-md shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/45 hover:bg-[#1d1d1d]">
      <div className="relative h-[108px] bg-[#242424]">
        {machine.image1 ? <img src={machine.image1} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" alt={machine.name || 'Maszyna'} /> : <ImageFallback className="h-full w-full" />}
        <div className="absolute left-2 top-2 rounded-full border border-yellow-500/35 bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-yellow-300 backdrop-blur">#{machine.index_number || 'brak'}</div>
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
              <input className="w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2 text-xs text-zinc-100 outline-none focus:border-yellow-500/60" placeholder="Cena zakupu" value={quickValues.purchase_price} onChange={(event) => onQuickChange('purchase_price', event.target.value)} />
              <input className="w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2 text-xs text-zinc-100 outline-none focus:border-yellow-500/60" placeholder="VAT" value={quickValues.vat_price} onChange={(event) => onQuickChange('vat_price', event.target.value)} />
              <input className="w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2 text-xs text-zinc-100 outline-none focus:border-yellow-500/60" placeholder="Cena" value={quickValues.gross_price} onChange={(event) => onQuickChange('gross_price', event.target.value)} />
            </div>
            <textarea className="h-20 w-full resize-none rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2 text-xs text-zinc-100 outline-none focus:border-yellow-500/60" placeholder="Notatka" value={quickValues.note} onChange={(event) => onQuickChange('note', event.target.value)} />
          </div>
        ) : (
          <p className="mb-3 line-clamp-2 min-h-9 break-words rounded-xl border border-white/5 bg-[#202020] px-3 py-2 text-[12px] leading-5 text-zinc-300">{machine.note || 'Brak notatki'}</p>
        )}

        {quickEditing ? (
          <div className="mt-auto grid grid-cols-2 gap-2" onClick={(event) => event.stopPropagation()}>
            <Button onClick={() => onSaveQuickEdit(machine)} disabled={saving} size="sm" variant="success">ZAPISZ</Button>
            <Button onClick={() => onQuickEdit(null)} size="sm">ANULUJ</Button>
          </div>
        ) : view === 'active' ? (
          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button onClick={(event) => { event.stopPropagation(); onQuickEdit(machine) }} size="sm">EDYTUJ</Button>
            <Button onClick={(event) => { event.stopPropagation(); onArchive(machine) }} size="sm" variant="primary">ARCHIWIZUJ</Button>
          </div>
        ) : (
          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button onClick={(event) => { event.stopPropagation(); onRestore(machine) }} size="sm" variant="success">PRZYWRĂ“Ä†</Button>
            <Button onClick={(event) => { event.stopPropagation(); onDelete(machine) }} size="sm" variant="danger">USUĹ</Button>
          </div>
        )}
      </div>
    </article>
  )
}


