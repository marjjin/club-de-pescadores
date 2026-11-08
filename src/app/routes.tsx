import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { PublicLayout } from './layout/PublicLayout'

const HomePage = lazy(() => import('@/pages/home'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))
const NewsPage = lazy(() => import('@/pages/news'))
const EventsPage = lazy(() => import('@/pages/events'))

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8">
          Cargando página…
        </p>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="noticias" element={<NewsPage />} />
          <Route path="eventos" element={<EventsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
