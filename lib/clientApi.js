export async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })

  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login'
  }

  return response
}

