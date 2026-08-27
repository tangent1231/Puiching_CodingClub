import { useEffect, useState } from 'react'
import { Image } from 'lucide-react'
import { api } from '../api/client'

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
                <figure
                  key={photo.record_id}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="p-3">
                    <p className="text-sm font-medium text-card-foreground">{photo.title}</p>
                    {photo.photo_date && (
                      <p className="mt-1 text-xs text-muted-foreground">{photo.photo_date}</p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
