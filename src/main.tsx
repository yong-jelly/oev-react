import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'
import { useUserStore } from './entities/user'
import './index.css'

const queryClient = new QueryClient()

const Root = () => {
  const syncSession = useUserStore((state) => state.syncSession)

  useEffect(() => {
    syncSession()
  }, [syncSession])

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
