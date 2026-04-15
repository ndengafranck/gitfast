import { useState, useEffect, useCallback } from 'react'

const DEFAULT = { pat: '', defaultFolder: '', defaultRemote: '' }

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    window.gitfast?.getSettings().then(s => {
      setSettings({ ...DEFAULT, ...s })
      setLoaded(true)
    })
  }, [])

  const save = useCallback(async (next) => {
    const merged = { ...settings, ...next }
    setSettings(merged)
    await window.gitfast?.saveSettings(merged)
    return merged
  }, [settings])

  return { settings, setSettings, save, loaded }
}
