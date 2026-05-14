export function logError(error, context = 'app') {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, error)
  }
}

export function apiError(message = 'Server error', status = 500) {
  return Response.json({ error: message }, { status })
}

