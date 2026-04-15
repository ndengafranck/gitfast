import { useState, useCallback, useRef } from 'react'

export function useGitStatus() {
  const [repoData, setRepoData] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const lastFolder = useRef(null)
  const inFlight   = useRef(false)

  const refresh = useCallback(async (folder) => {
    if (!folder) { setRepoData(null); setError(null); return }

    // Don't fire a second parallel request for same folder
    if (inFlight.current) return
    inFlight.current = true

    setLoading(true)
    setError(null)

    try {
      // Wait for bridge (preload injection)
      if (!window.gitfast) {
        await new Promise((resolve, reject) => {
          const deadline = Date.now() + 4000
          const t = setInterval(() => {
            if (window.gitfast) { clearInterval(t); resolve() }
            else if (Date.now() > deadline) { clearInterval(t); reject(new Error('Bridge not ready — try reloading')) }
          }, 50)
        })
      }

      // 8-second timeout so it never hangs forever
      const race = await Promise.race([
        window.gitfast.gitStatus({ folder }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out reading repository (8s). Is the folder a valid git repo?')), 8000)),
      ])

      if (race?.ok) {
        setRepoData(race)
        setError(null)
        lastFolder.current = folder
      } else {
        setRepoData(null)
        setError(race?.error || 'Unknown error')
      }
      return race
    } catch (e) {
      setRepoData(null)
      setError(e.message)
    } finally {
      setLoading(false)
      inFlight.current = false
    }
  }, [])

  return { repoData, loading, error, refresh }
}
