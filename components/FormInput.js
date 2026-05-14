'use client'

export const inputClassName =
  'w-full rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-[14px] font-medium text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-yellow-500/60 focus:bg-[#222] focus:ring-2 focus:ring-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-60'

export default function FormInput({ label, as = 'input', className = '', ...props }) {
  const Element = as

  return (
    <label className="block min-w-0">
      {label && <span className="mb-1.5 block text-[11px] font-bold uppercase text-zinc-500">{label}</span>}
      <Element className={`${inputClassName} ${className}`} {...props} />
    </label>
  )
}

