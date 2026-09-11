const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) throw new Error(`Complaint API request failed: ${response.status}`)
  return response.json()
}

export const complaintApi = {
  extract: (text, sourceName) => request('/api/complaints/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_name: sourceName })
  }),
  askAssistant: (message, fields) => request('/api/complaints/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, fields })
  }),
  save: (fields) => request('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  })
}
