'use client'

import { useEffect } from 'react'
import ImageFallback from './ImageFallback'
import Button from './Button'

export default function Gallery({ images, mainImage, onMainImageChange, lightboxIndex, setLightboxIndex, showLightbox, setShowLightbox, title = 'Maszyna' }) {
  const visibleImages = images.filter(Boolean)

  useEffect(() => {
    if (!showLightbox) return
    function onKeyDown(event) {
      if (event.key === 'Escape') setShowLightbox(false)
      if (event.key === 'ArrowLeft') setLightboxIndex((current) => (current === 0 ? visibleImages.length - 1 : current - 1))
      if (event.key === 'ArrowRight') setLightboxIndex((current) => (current === visibleImages.length - 1 ? 0 : current + 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setLightboxIndex, setShowLightbox, showLightbox, visibleImages.length])

  function open(image) {
    const index = visibleImages.indexOf(image)
    setLightboxIndex(index >= 0 ? index : 0)
    setShowLightbox(true)
  }

  return (
    <>
      <section className="rounded-2xl border border-yellow-500/15 bg-[#171717] p-3 shadow-lg shadow-black/25 sm:p-4">
        <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#242424] shadow-lg shadow-black/30">
          {mainImage ? (
            <img src={mainImage} alt={title} onClick={() => open(mainImage)} loading="eager" className="h-[280px] w-full cursor-pointer object-cover transition duration-300 hover:scale-[1.01] hover:opacity-95 sm:h-[420px] lg:h-[520px]" />
          ) : (
            <ImageFallback className="h-[280px] w-full sm:h-[420px] lg:h-[520px]" />
          )}
          <div className="absolute left-3 top-3 rounded-full border border-yellow-500/30 bg-black/75 px-3 py-1 text-xs font-bold text-yellow-400 backdrop-blur">
            {visibleImages.length > 0 ? `${Math.max(visibleImages.indexOf(mainImage), 0) + 1} / ${visibleImages.length}` : '0 / 4'}
          </div>
        </div>

        {visibleImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {visibleImages.map((image, index) => (
              <button key={image} onClick={() => onMainImageChange(image)} className={`overflow-hidden rounded-xl border-2 transition ${mainImage === image ? 'border-yellow-500' : 'border-transparent hover:border-yellow-500/40'}`} aria-label={`Zdjęcie ${index + 1}`}>
                <img src={image} alt="" loading="lazy" decoding="async" className="h-20 w-full object-cover sm:h-24" />
              </button>
            ))}
          </div>
        )}
      </section>

      {showLightbox && visibleImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4" onClick={() => setShowLightbox(false)}>
          <img src={visibleImages[lightboxIndex]} alt="" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
          {visibleImages.length > 1 && (
            <>
              <Button onClick={(event) => { event.stopPropagation(); setLightboxIndex((current) => (current === 0 ? visibleImages.length - 1 : current - 1)) }} className="absolute left-3 top-1/2 -translate-y-1/2 px-4 py-3 text-2xl sm:left-5" variant="primary" aria-label="Poprzednie zdjęcie">‹</Button>
              <Button onClick={(event) => { event.stopPropagation(); setLightboxIndex((current) => (current === visibleImages.length - 1 ? 0 : current + 1)) }} className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-3 text-2xl sm:right-5" variant="primary" aria-label="Następne zdjęcie">›</Button>
            </>
          )}
          <div className="absolute bottom-5 rounded-2xl border border-yellow-500/30 bg-[#181818] px-4 py-2 text-sm font-bold text-yellow-400">{lightboxIndex + 1} / {visibleImages.length}</div>
          <Button onClick={(event) => { event.stopPropagation(); setShowLightbox(false) }} className="absolute right-3 top-3 px-4 py-2 text-lg sm:right-5 sm:top-5" variant="primary" aria-label="Zamknij">X</Button>
        </div>
      )}
    </>
  )
}

