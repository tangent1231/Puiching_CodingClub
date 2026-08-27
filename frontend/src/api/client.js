const API_BASE = import.meta.env.VITE_API_URL || ''

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  getEvents: () => fetchJson('/api/events'),
  getAwards: (name = '') => fetchJson(`/api/awards?name=${encodeURIComponent(name)}`),
  getCertificateUrl: (recordId) => `${API_BASE}/api/awards/${recordId}/certificate`,
  getPhotos: (year) => fetchJson(`/api/photos${year ? `?year=${year}` : ''}`),
  getPhotoYears: () => fetchJson('/api/photos/years'),
  login: (username, password) => fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  getMe: (token) => fetchJson('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }),
}
