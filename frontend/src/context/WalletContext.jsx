import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getWallet } from '../api/walletApi'

export const WalletContext = createContext({
  wallet: { coinA: 0, coinB: 0 },
  refreshWallet: async () => {},
  isLoggedIn: false,
  loading: false,
  error: null,
})

function hasToken() {
  try {
    const directAccessToken = localStorage.getItem('accessToken')
    if (directAccessToken) return true

    const raw = localStorage.getItem('user')
    if (!raw) return false
    const user = JSON.parse(raw)
    return Boolean(user?.token || user?.accessToken)
  } catch {
    return false
  }
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState({ coinA: 0, coinB: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(hasToken)

  const refreshWallet = useCallback(async () => {
    if (!hasToken()) {
      setIsLoggedIn(false)
      setWallet({ coinA: 0, coinB: 0 })
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getWallet()
      setIsLoggedIn(true)
      setWallet({
        coinA: Number(data?.coinA ?? 0),
        coinB: Number(data?.coinB ?? 0),
      })
    } catch (e) {
      setError(e)
      const status = e?.response?.status
      if (status === 401) {
        setIsLoggedIn(false)
        setWallet({ coinA: 0, coinB: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshWallet()
  }, [refreshWallet])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        refreshWallet()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refreshWallet])

  const value = useMemo(() => ({ wallet, refreshWallet, isLoggedIn, loading, error }), [wallet, refreshWallet, isLoggedIn, loading, error])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
