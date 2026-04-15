import { useState, useCallback } from 'react'

let id = 0
const DURATION = { success: 3500, info: 3000, error: 10000 }

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const tid = ++id
    const duration = DURATION[type] ?? 4000
    setToasts(t => [...t, { id: tid, message: String(message), type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== tid)), duration)
  }, [])

  return { toasts, toast }
}
