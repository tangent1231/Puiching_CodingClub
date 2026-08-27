import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { api } from '../api/client'

function PhotoCard({ photo }) {
  const images = photo.image_urls && photo.image_urls.length > 0 ? photo.image_urls : [photo.image_url]
  const [index, setIndex] = useState(0)
  const total = images.length

  const prev = (e) => {
    e.stopPropagation()
    setIndex((i) => (i - 1 + total) % total)
  }
  const next = (e) => {
    e.stopPropagation()
    setIndex((i) => (i + 1) % total)
  }

  return (
    <figure className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {images.map((url, i) => (
          <img
            key={`${photo.record_id}-${i}`}
            src={url}
            alt={`${photo.title} ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        ))}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-100 transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="上一張"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-100 transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="下一張"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIndex(i)
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                  aria-label={`跳到第 ${i + 1} 張`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <figcaption className="p-3">
        <p className="text-sm font-medium text-card-foreground">{photo.title}</p>
        {photo.photo_date && (
          <p className="mt-1 text-xs text-muted-foreground">{photo.photo_date}</p>
        )}
      </figcaption>
    </figure>
  )
}

export default function Photos() {
  const [photos, setPhotos] = useState([])
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getPhotos(), api.getPhotoYears()])
      .then(([photosData, yearsData]) => {
        setPhotos(photosData)
        setYears(yearsData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const grouped = years.map((year) => ({
    year,
    items: photos.filter((p) => p.year === year).sort((a, b) => a.order - b.order),
  }))

  return (
    <section id="photos-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Image className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">活動相簿</h2>
          <p className="text-sm text-muted-foreground">按年份回顧精彩活動</p>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">載入中...</p>}
      {error && <p className="text-sm text-destructive">載入失敗：{error}</p>}

      <div className="space-y-10">
        {grouped.map((group) => (
          <div key={group.year}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <span className="inline-flex h-7 items-center justify-center rounded-md bg-[#c8a145] px-2.5 text-xs font-bold text-[#1f2937]">
                {group.year}
              </span>
              <span className="h-px flex-1 bg-border" />
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((photo) => (
                <PhotoCard key={photo.record_id} photo={photo} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
