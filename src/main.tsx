import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

const client = new QueryClient({
  defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } }
})

const ALLOW_ANY_LOGIN = (() => {
  const flag = import.meta.env.VITE_ALLOW_ANY_LOGIN
  if (typeof flag === 'string') return flag === 'true'
  return import.meta.env.PROD
})()

async function bootstrap() {
  // Enable MSW only during local dev or when VITE_API_MOCK=true 
  const enableMSW = import.meta.env.DEV || import.meta.env.VITE_API_MOCK === 'true' || ALLOW_ANY_LOGIN
  if (enableMSW) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ serviceWorker: { url: '/mockServiceWorker.js' } })
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <App />
          <Toaster richColors />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )
}

bootstrap()
