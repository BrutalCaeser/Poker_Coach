import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

/*
 * Two front doors while v3 is a prototype:
 *   /?v3   → the new lesson experience (its own design system; the old global
 *            stylesheet is never loaded, so nothing leaks into it)
 *   /      → the existing app, unchanged
 */
const isV3 = new URLSearchParams(window.location.search).has('v3')

const Root = isV3
  ? lazy(() => import('./lesson/LessonApp.jsx'))
  : lazy(() => import('./styles.css').then(() => import('./App.jsx')))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
