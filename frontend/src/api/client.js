import { supabase } from '../lib/supabase'

const FUNCTION_NAMES = {
  events: 'events',
  awards: 'awards',
  photos: 'photos',
  certificate: 'certificate',
  awardReview: 'award-review',
}

async function invokeFunction(name, { method = 'GET', body, query } = {}) {
  const path = query ? `${name}?${new URLSearchParams(query).toString()}` : name
  const { data, error } = await supabase.functions.invoke(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (error) {
    throw new Error(error.message || `Function ${name} failed`)
  }
  return data
}

export const api = {
  getEvents: () => invokeFunction(FUNCTION_NAMES.events),
  getAwards: (name = '') =>
    invokeFunction(FUNCTION_NAMES.awards, {
      query: name ? { q: name } : undefined,
    }),
  getCertificateUrl: (recordId, fileToken) => {
    const params = new URLSearchParams()
    if (recordId) params.set('recordId', recordId)
    if (fileToken) params.set('fileToken', fileToken)
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/certificate?${params.toString()}`
  },
  getPhotos: (year) =>
    invokeFunction(FUNCTION_NAMES.photos, {
      query: year !== undefined ? { year: String(year) } : undefined,
    }),
  getPhotoYears: async () => {
    const photos = await invokeFunction(FUNCTION_NAMES.photos)
    const years = [...new Set(photos.map((p) => p.year))]
    return years.sort((a, b) => b - a)
  },
  getAllAwardsForReview: () => invokeFunction(FUNCTION_NAMES.awardReview),
  updateAwardVisibility: (recordId, visible) =>
    invokeFunction(FUNCTION_NAMES.awardReview, {
      method: 'PUT',
      body: { record_id: recordId, visible },
    }),
}
