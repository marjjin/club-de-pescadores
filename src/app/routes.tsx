import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { PublicLayout } from './layout/PublicLayout'
import { PageLoading } from './layout/PageLoading'

const HomePage = lazy(() => import('@/pages/home'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))
const NewsPage = lazy(() => import('@/pages/news'))
const NewsDetailPage = lazy(() => import('@/pages/news-detail'))
const EventsPage = lazy(() => import('@/pages/events'))
const AdminPage = lazy(() => import('@/pages/admin'))

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="admin/*" element={<AdminPage />} />
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="noticias" element={<NewsPage />} />
          <Route path="noticias/:id" element={<NewsDetailPage />} />
          <Route path="eventos" element={<EventsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
