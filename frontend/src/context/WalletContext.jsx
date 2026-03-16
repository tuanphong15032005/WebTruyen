import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getWallet } from '../api/walletApi'
import useNotify from '../hooks/useNotify'

const INITIAL_WALLET = { coinA: 0, coinB: 0, pendingCoinB: 0 }
const WALLET_POLL_INTERVAL_MS = 10000

export const WalletContext = createContext({
  wallet: INITIAL_WALLET,
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
  const { notify } = useNotify()
  const [wallet, setWallet] = useState(INITIAL_WALLET)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(hasToken)
  const walletRef = useRef(INITIAL_WALLET)
  const hasLoadedWalletRef = useRef(false)

  const refreshWallet = useCallback(async ({ silent = false } = {}) => {
    if (!hasToken()) {
      setIsLoggedIn(false)
      walletRef.current = INITIAL_WALLET
      hasLoadedWalletRef.current = false
      setWallet(INITIAL_WALLET)
      return
    }

    if (!silent) {
      setLoading(true)
    }
    setError(null)
    try {
      const data = await getWallet()
      const nextWallet = {
        coinA: Number(data?.coinA ?? 0),
        coinB: Number(data?.coinB ?? 0),
        pendingCoinB: Number(data?.pendingCoinB ?? 0),
      }
      const previousWallet = walletRef.current
      const settledAmount =
        hasLoadedWalletRef.current &&
        nextWallet.coinB > previousWallet.coinB &&
        nextWallet.pendingCoinB < previousWallet.pendingCoinB
          ? nextWallet.coinB - previousWallet.coinB
          : 0

      setIsLoggedIn(true)
      walletRef.current = nextWallet
      hasLoadedWalletRef.current = true
      setWallet((currentWallet) =>
        currentWallet.coinA === nextWallet.coinA &&
        currentWallet.coinB === nextWallet.coinB &&
        currentWallet.pendingCoinB === nextWallet.pendingCoinB
          ? currentWallet
          : nextWallet,
      )

      if (settledAmount > 0) {
        notify(
          `+${settledAmount.toLocaleString('vi-VN')} kim cương đã được cộng vào ví`,
          'success',
        )
      }
    } catch (e) {
      setError(e)
      const status = e?.response?.status
      if (status === 401) {
        setIsLoggedIn(false)
        walletRef.current = INITIAL_WALLET
        hasLoadedWalletRef.current = false
        setWallet(INITIAL_WALLET)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [notify])

  useEffect(() => {
    refreshWallet()
  }, [refreshWallet])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user' || e.key === 'accessToken') {
        refreshWallet()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refreshWallet])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    const timer = window.setInterval(() => {
      refreshWallet({ silent: true })
    }, WALLET_POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [isLoggedIn, refreshWallet])

  const value = useMemo(() => ({ wallet, refreshWallet, isLoggedIn, loading, error }), [wallet, refreshWallet, isLoggedIn, loading, error])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
