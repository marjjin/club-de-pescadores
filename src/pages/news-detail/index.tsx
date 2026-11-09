import { useParams } from 'react-router'
import { NewsArticle } from '@/features/news'

export default function NewsDetailPage() {
  const { id } = useParams()
  return <NewsArticle key={id} id={id ?? ''} />
}
