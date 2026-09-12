const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) {
    let detail = null
    try { detail = await response.json() } catch { /* keep the HTTP status error */ }
    const error = new Error(detail?.detail?.message || detail?.detail || `Complaint API request failed: ${response.status}`)
    error.status = response.status
    error.detail = detail?.detail
    throw error
  }
  return response.json()
}

export const complaintApi = {
  extract: (text, sourceName) => request('/api/complaints/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_name: sourceName })
  }),
  updateComplaint: (message, fields) => request('/api/complaints/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, fields })
  }),
  save: (fields) => request('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  }),
  list: () => request('/api/complaints'),
  review: (complaintId) => request(`/api/complaints/${complaintId}/review`, { method: 'POST' })
}
