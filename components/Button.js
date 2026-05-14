'use client'

const variants = {
  primary: 'bg-yellow-500 text-black shadow-yellow-950/30 hover:bg-yellow-400',
  success: 'bg-green-600 text-white shadow-green-950/30 hover:bg-green-500',
  danger: 'bg-red-600 text-white shadow-red-950/30 hover:bg-red-500',
  subtle: 'border border-white/10 bg-[#242424] text-white shadow-black/20 hover:bg-[#303030]',
}

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-sm',
}

export default function Button({ children, className = '', variant = 'subtle', size = 'md', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`rounded-xl font-bold shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.subtle} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

