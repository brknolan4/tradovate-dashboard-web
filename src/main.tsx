import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html')
}

const root = createRoot(rootElement)

function renderBootError(error: unknown) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  console.error('Boot failure:', error)

  root.render(
    <div className="min-h-screen w-screen bg-[#0a0e14] text-white flex items-center justify-center p-8">
      <div className="max-w-3xl w-full rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 shadow-2xl">
        <div className="text-[11px] uppercase tracking-[0.28em] text-rose-300 font-black mb-3">App boot error</div>
        <h1 className="text-3xl font-black mb-3">The dashboard failed before React finished loading.</h1>
        <p className="text-slate-200 mb-5 leading-relaxed">
          This replaces the blank screen with the actual startup error so it can be fixed directly.
        </p>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-rose-100 break-words whitespace-pre-wrap">
          {message}
        </div>
        <div className="text-sm text-slate-300 mt-5">
          Check the browser console too if you want more detail, but this message is the important part.
        </div>
      </div>
    </div>
  )
}

Promise.all([
  import('./App.tsx'),
  import('./components/AppErrorBoundary.tsx'),
  import('./components/AuthGate.tsx'),
  import('./context/DataContext'),
  import('./context/SyncContext'),
])
  .then(([{ default: App }, { default: AppErrorBoundary }, { default: AuthGate }, { DataProvider }, { SyncProvider }]) => {
    root.render(
      <StrictMode>
        <AppErrorBoundary>
          <AuthGate>
            <SyncProvider>
              <DataProvider>
                <App />
              </DataProvider>
            </SyncProvider>
          </AuthGate>
        </AppErrorBoundary>
      </StrictMode>,
    )
  })
  .catch(renderBootError)
